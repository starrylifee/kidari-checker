import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * 한글 요일을 영어로 변환
 */
function convertKoreanDay(dateStr) {
    const dayMap = {
        '(월)': '(Mon)',
        '(화)': '(Tue)',
        '(수)': '(Wed)',
        '(목)': '(Thu)',
        '(금)': '(Fri)',
        '(토)': '(Sat)',
        '(일)': '(Sun)'
    }

    let result = dateStr
    for (const [korean, english] of Object.entries(dayMap)) {
        result = result.replace(korean, english)
    }
    return result
}

/**
 * 점검 결과 PDF 생성
 */
export function generatePDF(results) {
    const doc = new jsPDF()

    // 제목
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Kidari Lesson Checker Report', 105, 20, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, 105, 28, { align: 'center' })

    const { totalLessons, durationIssues, consecutiveIssues, conflictIssues, lessonsDetail } = results
    const totalIssues = durationIssues.length + consecutiveIssues.length + conflictIssues.length
    const passedLessons = lessonsDetail.filter(l => l.issues.length === 0).length

    // 요약 박스
    doc.setFillColor(37, 37, 64)
    doc.roundedRect(14, 35, 182, 30, 3, 3, 'F')

    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.text('Summary', 20, 45)
    doc.setFontSize(10)
    doc.text(`Total Lessons: ${totalLessons}`, 20, 55)
    doc.text(`Passed: ${passedLessons}`, 80, 55)
    doc.text(`Issues Found: ${totalIssues}`, 140, 55)
    doc.setTextColor(0, 0, 0)

    let yPos = 75

    // 40분 미만 수업
    if (durationIssues.length > 0) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Duration Issues (< 40min): ${durationIssues.length}`, 14, yPos)
        doc.setFont('helvetica', 'normal')
        yPos += 5

        doc.autoTable({
            startY: yPos,
            head: [['Date', 'Time', 'Duration', 'Shortage']],
            body: durationIssues.map(issue => [
                convertKoreanDay(issue.date),
                issue.time,
                `${issue.duration}min`,
                `${issue.shortage}min`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11] },
            margin: { left: 14 },
            styles: { fontSize: 9 }
        })
        yPos = doc.lastAutoTable.finalY + 10
    }

    // 연차시 80분 미만
    if (consecutiveIssues.length > 0) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Consecutive Session Issues (< 80min): ${consecutiveIssues.length}`, 14, yPos)
        doc.setFont('helvetica', 'normal')
        yPos += 5

        doc.autoTable({
            startY: yPos,
            head: [['Date', 'Time', 'Total Duration', 'Shortage']],
            body: consecutiveIssues.map(issue => [
                convertKoreanDay(issue.date),
                issue.time,
                `${issue.totalDuration}min`,
                `${issue.shortage}min`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11] },
            margin: { left: 14 },
            styles: { fontSize: 9 }
        })
        yPos = doc.lastAutoTable.finalY + 10
    }

    // 일정 충돌
    if (conflictIssues.length > 0) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Schedule Conflicts: ${conflictIssues.length}`, 14, yPos)
        doc.setFont('helvetica', 'normal')
        yPos += 5

        doc.autoTable({
            startY: yPos,
            head: [['Lesson Date', 'Lesson Time', 'Type', 'Conflict Period']],
            body: conflictIssues.map(issue => [
                convertKoreanDay(issue.lessonDate),
                issue.lessonTime,
                issue.conflictType === '근무상황' ? 'Work Status' : 'Business Trip',
                issue.conflictPeriod
            ]),
            theme: 'striped',
            headStyles: { fillColor: [239, 68, 68] },
            margin: { left: 14 },
            styles: { fontSize: 9 }
        })
    }

    // 전체 수업 목록 (새 페이지)
    doc.addPage()
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('All Lessons', 14, 20)
    doc.setFont('helvetica', 'normal')

    doc.autoTable({
        startY: 28,
        head: [['#', 'Date', 'Time', 'Duration', 'Status']],
        body: lessonsDetail.map(lesson => [
            lesson.index,
            convertKoreanDay(lesson.date),
            lesson.time,
            `${lesson.duration}min`,
            lesson.issues.length === 0 ? 'OK' : 'ISSUE'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14 },
        styles: { fontSize: 9 },
        didParseCell: function (data) {
            if (data.column.index === 4 && data.cell.raw === 'ISSUE') {
                data.cell.styles.textColor = [239, 68, 68]
                data.cell.styles.fontStyle = 'bold'
            }
            if (data.column.index === 4 && data.cell.raw === 'OK') {
                data.cell.styles.textColor = [34, 197, 94]
            }
        }
    })

    // 푸터
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
            `Page ${i} of ${pageCount} | Seoul Sindap Elementary School`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        )
    }

    // 다운로드
    const fileName = `kidari_report_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
}
