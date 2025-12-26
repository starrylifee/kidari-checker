/**
 * 키다리샘 수업 점검 로직
 */

/**
 * 수업 기록 점검
 * @param {Array} lessons - 수업 기록 배열
 * @param {Array} workSchedules - 근무상황 목록
 * @param {Array} tripSchedules - 출장 목록
 */
export function checkLessons(lessons, workSchedules, tripSchedules) {
    const results = {
        totalLessons: lessons.length,
        durationIssues: [],
        consecutiveIssues: [],
        conflictIssues: [],
        lessonsDetail: []
    }

    lessons.forEach((lesson, index) => {
        // fullDate를 Date 객체로 확실히 변환
        let lessonFullDate = lesson.fullDate
        if (typeof lesson.fullDate === 'string') {
            lessonFullDate = new Date(lesson.fullDate)
        }

        const lessonInfo = {
            index: index + 1,
            date: lesson.date,
            time: `${lesson.startTime}~${lesson.endTime}`,
            duration: lesson.duration,
            issues: []
        }

        // 1. 40분 미만 체크
        if (lesson.duration < 40) {
            const issue = `수업시간 부족: ${lesson.duration}분 (40분 미만)`
            lessonInfo.issues.push(issue)
            results.durationIssues.push({
                date: lesson.date,
                time: `${lesson.startTime}~${lesson.endTime}`,
                duration: lesson.duration,
                shortage: 40 - lesson.duration
            })
        }

        // 2. 연차시 체크 (같은 날 연속 수업)
        if (index > 0) {
            const prevLesson = lessons[index - 1]
            let prevFullDate = prevLesson.fullDate
            if (typeof prevLesson.fullDate === 'string') {
                prevFullDate = new Date(prevLesson.fullDate)
            }

            if (isSameDate(lessonFullDate, prevFullDate) &&
                isConsecutive(prevLesson.endTime, lesson.startTime)) {
                const totalDuration = prevLesson.duration + lesson.duration
                if (totalDuration < 80) {
                    const issue = `연차시 시간 부족: ${totalDuration}분 (80분 미만)`
                    lessonInfo.issues.push(issue)
                    results.consecutiveIssues.push({
                        date: lesson.date,
                        time: `${prevLesson.startTime}~${lesson.endTime}`,
                        totalDuration: totalDuration,
                        shortage: 80 - totalDuration
                    })
                }
            }
        }

        // 3. 근무상황 충돌 체크
        for (const schedule of workSchedules) {
            if (hasTimeOverlap(lessonFullDate, lesson.startTime, lesson.endTime, schedule)) {
                const issue = `근무상황 충돌: ${schedule.type} (${schedule.detail})`
                lessonInfo.issues.push(issue)
                results.conflictIssues.push({
                    lessonDate: lesson.date,
                    lessonTime: `${lesson.startTime}~${lesson.endTime}`,
                    conflictType: '근무상황',
                    conflictDetail: `${schedule.type}: ${schedule.detail}`,
                    conflictPeriod: formatSchedulePeriod(schedule)
                })
            }
        }

        // 4. 출장 충돌 체크
        for (const schedule of tripSchedules) {
            if (hasTimeOverlap(lessonFullDate, lesson.startTime, lesson.endTime, schedule)) {
                const issue = `출장 충돌: ${schedule.type} (${schedule.detail})`
                lessonInfo.issues.push(issue)
                results.conflictIssues.push({
                    lessonDate: lesson.date,
                    lessonTime: `${lesson.startTime}~${lesson.endTime}`,
                    conflictType: '출장',
                    conflictDetail: `${schedule.type}: ${schedule.detail}`,
                    conflictPeriod: formatSchedulePeriod(schedule)
                })
            }
        }

        results.lessonsDetail.push(lessonInfo)
    })

    return results
}

/**
 * 같은 날짜인지 확인
 */
function isSameDate(date1, date2) {
    if (!date1 || !date2) return false
    if (!(date1 instanceof Date) || !(date2 instanceof Date)) return false
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
}

/**
 * 연속 수업인지 확인 (이전 수업 종료시간 = 다음 수업 시작시간)
 */
function isConsecutive(endTime, startTime) {
    return endTime === startTime
}

/**
 * 시간 겹침 확인
 */
function hasTimeOverlap(lessonDate, lessonStartTime, lessonEndTime, schedule) {
    if (!lessonDate || !(lessonDate instanceof Date)) return false

    // 수업 시작/종료 시간 생성
    const lessonStart = new Date(lessonDate)
    const [startHour, startMin] = lessonStartTime.split(':').map(Number)
    lessonStart.setHours(startHour, startMin, 0, 0)

    const lessonEnd = new Date(lessonDate)
    const [endHour, endMin] = lessonEndTime.split(':').map(Number)
    lessonEnd.setHours(endHour, endMin, 0, 0)

    // 스케줄이 Date 객체인지 확인
    const scheduleStart = schedule.startTime instanceof Date ? schedule.startTime : new Date(schedule.startTime)
    const scheduleEnd = schedule.endTime instanceof Date ? schedule.endTime : new Date(schedule.endTime)

    // 겹치지 않는 경우: 수업 종료 <= 스케줄 시작 OR 수업 시작 >= 스케줄 종료
    const noOverlap = lessonEnd <= scheduleStart || lessonStart >= scheduleEnd
    return !noOverlap
}

/**
 * 스케줄 기간 포맷
 */
function formatSchedulePeriod(schedule) {
    const formatDate = (d) => {
        if (!(d instanceof Date)) d = new Date(d)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const hour = String(d.getHours()).padStart(2, '0')
        const min = String(d.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day} ${hour}:${min}`
    }
    return `${formatDate(schedule.startTime)} ~ ${formatDate(schedule.endTime)}`
}
