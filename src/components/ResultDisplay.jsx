import { generatePDF } from '../services/pdfReport'

function ResultDisplay({ results }) {
    const { totalLessons, durationIssues, consecutiveIssues, conflictIssues, lessonsDetail } = results

    const totalIssues = durationIssues.length + consecutiveIssues.length + conflictIssues.length
    const passedLessons = lessonsDetail.filter(l => l.issues.length === 0).length

    const handleDownloadPDF = () => {
        generatePDF(results)
    }

    return (
        <section className="results-section">
            <div className="results-header">
                <h2>📊 점검 결과</h2>
                <button className="btn btn-secondary" onClick={handleDownloadPDF}>
                    📥 PDF 다운로드
                </button>
            </div>

            <div className="summary-cards">
                <div className="summary-card success">
                    <div className="count">{totalLessons}</div>
                    <div className="label">전체 차시</div>
                </div>
                <div className={`summary-card ${passedLessons === totalLessons ? 'success' : 'warning'}`}>
                    <div className="count">{passedLessons}</div>
                    <div className="label">정상 차시</div>
                </div>
                <div className={`summary-card ${totalIssues === 0 ? 'success' : 'error'}`}>
                    <div className="count">{totalIssues}</div>
                    <div className="label">발견된 문제</div>
                </div>
            </div>

            {/* Issue Summary */}
            {totalIssues > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2>⚠️ 문제 요약</h2>
                    <div style={{ marginTop: '1rem' }}>
                        {durationIssues.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--warning)' }}>⏱️ 40분 미만 수업: {durationIssues.length}건</strong>
                                <ul className="issue-list">
                                    {durationIssues.map((issue, idx) => (
                                        <li key={idx}>
                                            {issue.date} {issue.time} → {issue.duration}분 ({issue.shortage}분 부족)
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {consecutiveIssues.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--warning)' }}>⏱️ 연차시 80분 미만: {consecutiveIssues.length}건</strong>
                                <ul className="issue-list">
                                    {consecutiveIssues.map((issue, idx) => (
                                        <li key={idx}>
                                            {issue.date} {issue.time} → {issue.totalDuration}분 ({issue.shortage}분 부족)
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {conflictIssues.length > 0 && (
                            <div>
                                <strong style={{ color: 'var(--error)' }}>📅 일정 충돌: {conflictIssues.length}건</strong>
                                <ul className="issue-list">
                                    {conflictIssues.map((issue, idx) => (
                                        <li key={idx}>
                                            {issue.lessonDate} {issue.lessonTime} - [{issue.conflictType}] {issue.conflictDetail}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lessons Detail Table */}
            <div className="card">
                <h2>📋 전체 수업 목록</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table className="lesson-table">
                        <thead>
                            <tr>
                                <th>차시</th>
                                <th>날짜</th>
                                <th>시간</th>
                                <th>수업시간</th>
                                <th>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lessonsDetail.map((lesson) => (
                                <tr key={lesson.index}>
                                    <td>{lesson.index}차시</td>
                                    <td>{lesson.date}</td>
                                    <td>{lesson.time}</td>
                                    <td>{lesson.duration}분</td>
                                    <td>
                                        {lesson.issues.length === 0 ? (
                                            <span className="status-badge ok">✅ 정상</span>
                                        ) : (
                                            <span className="status-badge issue">❌ 문제</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

export default ResultDisplay
