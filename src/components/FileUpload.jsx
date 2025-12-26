import { useState, useRef } from 'react'

function FileUpload({ label, hint, subHint, accept, file, onChange, icon }) {
    const [isDragOver, setIsDragOver] = useState(false)
    const inputRef = useRef(null)

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = () => {
        setIsDragOver(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragOver(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            onChange(droppedFile)
        }
    }

    const handleClick = () => {
        inputRef.current?.click()
    }

    const handleChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            onChange(selectedFile)
        }
    }

    return (
        <div className="card">
            <h2>{icon} {label}</h2>
            <div
                className={`upload-zone ${isDragOver ? 'dragover' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                />
                {file ? (
                    <>
                        <span className="icon">✅</span>
                        <span className="label">파일 선택됨</span>
                        <span className="filename">{file.name}</span>
                    </>
                ) : (
                    <>
                        <span className="icon">📁</span>
                        <span className="label">클릭하거나 파일을 드래그하세요</span>
                        <span className="hint">{hint}</span>
                        {subHint && <span className="sub-hint">{subHint}</span>}
                    </>
                )}
            </div>
        </div>
    )
}

export default FileUpload
