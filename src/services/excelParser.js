import * as XLSX from 'xlsx'

/**
 * 엑셀 파일 파싱
 * @param {File} file - 엑셀 파일
 * @param {string} type - 'workStatus' 또는 'businessTrip'
 */
export async function parseExcel(file, type) {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (type === 'workStatus') {
        return parseWorkStatus(data)
    } else if (type === 'businessTrip') {
        return parseBusinessTrip(data)
    }

    return []
}

/**
 * 근무상황목록 파싱
 * 컬럼: 신청당시 부서명, 성명, 근무상황, 기간, 일수/기간, 사유, 목적지, 연가신청구분, 신청자, 결재상태, 삭제여부
 */
function parseWorkStatus(data) {
    const schedules = []

    // 첫 번째 행은 헤더이므로 건너뜀
    for (let i = 1; i < data.length; i++) {
        const row = data[i]
        if (!row || row.length < 10) continue

        const period = row[3]   // 기간
        const status = row[2]   // 근무상황
        const reason = row[5]   // 사유
        const approval = row[9] // 결재상태

        // 완결된 것만 (기결취소 제외)
        if (period && approval &&
            String(approval).includes('완결') &&
            !String(approval).includes('기결취소')) {

            // "2025-12-16 14:30 ~ 2025-12-16 16:30" 형태 파싱
            const match = String(period).match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*~\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/)
            if (match) {
                schedules.push({
                    startTime: parseDateTime(match[1], '-'),
                    endTime: parseDateTime(match[2], '-'),
                    type: String(status),
                    detail: String(reason || '')
                })
            }
        }
    }

    return schedules
}

/**
 * 출장목록 파싱
 * 컬럼: 순번, 부서, 신청당시부서, 출장종류, 출장지, 출장목적, 공용차량, 출장기간, 일수/기간, 결재상태, 출장인원, 신청자, 삭제여부
 */
function parseBusinessTrip(data) {
    const schedules = []

    // 첫 번째 행은 헤더, 두 번째 행은 빈 행인 경우가 있음
    for (let i = 1; i < data.length; i++) {
        const row = data[i]
        if (!row || row.length < 12) continue

        const period = row[7]      // 출장기간
        const destination = row[4] // 출장지
        const purpose = row[5]     // 출장목적
        const approval = row[9]    // 결재상태
        const applicant = row[11]  // 신청자

        // 완결된 것만 (기결취소 제외)
        // 나이스에서 본인 이름으로 검색 후 다운로드하므로 모든 출장이 본인 관련
        if (period && approval &&
            String(approval).includes('완결') &&
            !String(approval).includes('기결취소')) {

            // "2025.12.31 13:00 ~ 2025.12.31 16:30" 형태 파싱
            const match = String(period).match(/(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2})\s*~\s*(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2})/)
            if (match) {
                schedules.push({
                    startTime: parseDateTime(match[1], '.'),
                    endTime: parseDateTime(match[2], '.'),
                    type: String(destination || ''),
                    detail: String(purpose || '')
                })
            }
        }
    }

    return schedules
}

/**
 * 날짜/시간 문자열을 Date 객체로 변환
 * @param {string} str - "2025-12-16 14:30" 또는 "2025.12.16 14:30"
 * @param {string} dateSep - 날짜 구분자 ('-' 또는 '.')
 */
function parseDateTime(str, dateSep) {
    const [datePart, timePart] = str.trim().split(/\s+/)
    const [year, month, day] = datePart.split(dateSep).map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    return new Date(year, month - 1, day, hour, minute)
}
