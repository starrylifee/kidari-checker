/**
 * Upstage Document Parse API 서비스
 * 보안을 위해 항상 Serverless Function을 통해 API 호출
 * (API 키가 클라이언트에 노출되지 않음)
 */

export async function parseDocument(file) {
    // 파일을 Base64로 변환
    const base64 = await fileToBase64(file)

    // 항상 Serverless Function을 통해 호출 (API 키 보호)
    return await parseDocumentServerless(file, base64)
}

/**
 * Serverless Function 호출 (API 키가 서버에서만 사용됨)
 */
async function parseDocumentServerless(file, base64Data) {
    const response = await fetch('/api/parse-document', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            fileType: getFileType(file.name)
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '문서 분석에 실패했습니다.')
    }

    const data = await response.json()
    return data.lessons
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]
            resolve(base64)
        }
        reader.onerror = (error) => reject(error)
    })
}

function getFileType(fileName) {
    const ext = fileName.toLowerCase().split('.').pop()
    switch (ext) {
        case 'pdf':
            return 'pdf'
        case 'hwp':
            return 'hwp'
        case 'hwpx':
            return 'hwpx'
        default:
            return 'unknown'
    }
}
