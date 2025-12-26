import { useState } from 'react'
import FileUpload from './components/FileUpload'
import ResultDisplay from './components/ResultDisplay'
import { parseDocument } from './services/upstageParser'
import { parseExcel } from './services/excelParser'
import { checkLessons } from './services/checker'

function App() {
    const [files, setFiles] = useState({
        lessonLog: null,
        workStatus: null,
        businessTrip: null
    })
    const [results, setResults] = useState(null)
    const [loading, setLoading] = useState(false)
    const [loadingStep, setLoadingStep] = useState('')
    const [error, setError] = useState(null)

    const handleFileChange = (type, file) => {
        setFiles(prev => ({ ...prev, [type]: file }))
        setResults(null)
        setError(null)
    }

    const canCheck = files.lessonLog && files.workStatus && files.businessTrip

    const handleCheck = async () => {
        if (!canCheck) return

        setLoading(true)
        setError(null)
        setResults(null)

        try {
            // 1. 지도일지 파싱 (Upstage API)
            setLoadingStep('지도일지 분석 중...')
            const lessons = await parseDocument(files.lessonLog)

            // 2. 근무상황 파싱
            setLoadingStep('근무상황 목록 분석 중...')
            const workSchedules = await parseExcel(files.workStatus, 'workStatus')

            // 3. 출장목록 파싱
            setLoadingStep('출장 목록 분석 중...')
            const tripSchedules = await parseExcel(files.businessTrip, 'businessTrip')

            // 4. 점검 수행
            setLoadingStep('점검 수행 중...')
            const checkResults = checkLessons(lessons, workSchedules, tripSchedules)

            setResults(checkResults)
        } catch (err) {
            console.error('Error:', err)
            setError(err.message || '점검 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
            setLoadingStep('')
        }
    }

    const handleReset = () => {
        setFiles({ lessonLog: null, workStatus: null, businessTrip: null })
        setResults(null)
        setError(null)
    }

    return (
        <div className="app">
            <header className="header">
                <h1>📋 키다리샘 점검표</h1>
                <p>기초학력 보충 프로그램 지도일지를 점검합니다</p>
            </header>

            <section className="upload-section">
                <FileUpload
                    label="지도일지"
                    hint="HWP, HWPX, PDF"
                    accept=".hwp,.hwpx,.pdf"
                    file={files.lessonLog}
                    onChange={(file) => handleFileChange('lessonLog', file)}
                    icon="📄"
                />
                <FileUpload
                    label="근무상황 목록"
                    hint="나이스에서 수정 없이 그대로 업로드"
                    subHint="복무 → 개인근무상황관리 → 기간설정 → 조회 → 엑셀내려받기"
                    accept=".xlsx,.xls"
                    file={files.workStatus}
                    onChange={(file) => handleFileChange('workStatus', file)}
                    icon="📅"
                />
                <FileUpload
                    label="출장 목록"
                    hint="나이스에서 수정 없이 그대로 업로드"
                    subHint="복무 → 개인출장관리 → 기간설정 → 조회 → 엑셀내려받기"
                    accept=".xlsx,.xls"
                    file={files.businessTrip}
                    onChange={(file) => handleFileChange('businessTrip', file)}
                    icon="✈️"
                />
            </section>

            <section className="action-section">
                <button
                    className="btn btn-primary"
                    onClick={handleCheck}
                    disabled={!canCheck || loading}
                >
                    {loading ? '점검 중...' : '🔍 점검 시작'}
                </button>
                {(files.lessonLog || files.workStatus || files.businessTrip) && (
                    <button
                        className="btn btn-secondary"
                        onClick={handleReset}
                        style={{ marginLeft: '1rem' }}
                    >
                        초기화
                    </button>
                )}
            </section>

            {loading && (
                <div className="card loading">
                    <div className="spinner"></div>
                    <p className="loading-text">{loadingStep}</p>
                </div>
            )}

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            {results && <ResultDisplay results={results} />}

            {/* 경고 안내 */}
            <div className="notice-box">
                <p>⚠️ <strong>주의:</strong> 학생 이름 등 개인을 특정할 수 있는 정보가 포함된 파일은 업로드하지 마세요.</p>
            </div>

            {/* 푸터 */}
            <footer className="footer">
                <p className="footer-notice">
                    본 서비스는 <a href="https://www.upstage.ai" target="_blank" rel="noopener noreferrer">Upstage AI</a>를 이용하며, 업로드된 파일 및 개인정보를 저장하지 않습니다.
                </p>
                <p className="footer-copyright">
                    © 2025 서울신답초등학교 정용석
                </p>
            </footer>
        </div>
    )
}

export default App
