/**
 * Upstage Document Parse API 서비스
 * 로컬: 직접 API 호출 (VITE_UPSTAGE_API_KEY 사용)
 * Vercel: Serverless Function 호출
 */

export async function parseDocument(file) {
    // 파일을 Base64로 변환
    const base64 = await fileToBase64(file)

    // 환경에 따라 다른 방식으로 호출
    const apiKey = import.meta.env.VITE_UPSTAGE_API_KEY

    if (apiKey) {
        // 로컬 개발: 직접 API 호출
        return await parseDocumentLocal(file, base64, apiKey)
    } else {
        // Vercel 배포: Serverless Function 호출
        return await parseDocumentServerless(file, base64)
    }
}

/**
 * 로컬 개발용: 직접 Upstage API 호출
 */
async function parseDocumentLocal(file, base64Data, apiKey) {
    // 1. Document Parse API 호출
    const formData = new FormData()
    formData.append('document', file)
    formData.append('output_formats', JSON.stringify(['text']))
    formData.append('ocr', 'auto')
    formData.append('model', 'document-parse')

    const parseResponse = await fetch('https://api.upstage.ai/v1/document-digitization', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        body: formData
    })

    if (!parseResponse.ok) {
        const error = await parseResponse.text()
        throw new Error(`문서 분석 실패: ${error}`)
    }

    const parseResult = await parseResponse.json()
    const documentText = parseResult.text || parseResult.content?.text || ''

    // 2. Solar Pro2로 구조화
    const lessons = await extractLessonsWithSolar(documentText, apiKey)
    return lessons
}

/**
 * Vercel 배포용: Serverless Function 호출
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

/**
 * Solar Pro2로 수업 정보 추출
 */
async function extractLessonsWithSolar(documentText, apiKey) {
    const prompt = `당신은 한국 초등학교 키다리샘(기초학력 보충) 지도일지 분석 전문가입니다.

다음 지도일지 텍스트에서 각 수업 정보를 추출해주세요.

[지도일지 텍스트]
${documentText}

[추출 규칙]
1. 각 수업의 날짜, 시작시간, 종료시간, 수업시간(분)을 추출합니다.
2. 날짜 형식: "4. 18. (금)" → "4. 18. (금)"
3. 시간 형식: "13:40~14:20" → startTime: "13:40", endTime: "14:20"
4. 수업시간 계산: 종료시간 - 시작시간 (분 단위)
5. 연도는 2025년으로 가정합니다.

[출력 형식]
반드시 다음 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
{
  "lessons": [
    {
      "date": "4. 18. (금)",
      "startTime": "13:40",
      "endTime": "14:20",
      "duration": 40,
      "fullDate": "2025-04-18"
    }
  ]
}
`

    const response = await fetch('https://api.upstage.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'solar-pro2',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            reasoning_effort: 'medium',
            temperature: 0.1
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`AI 분석 실패: ${error}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || ''

    // JSON 추출
    try {
        const jsonMatch = content.match(/\{[\s\S]*"lessons"[\s\S]*\}/)
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            return parsed.lessons.map(lesson => ({
                ...lesson,
                fullDate: lesson.fullDate ? new Date(lesson.fullDate) : null
            }))
        }
    } catch (e) {
        console.error('JSON parsing error:', e, content)
    }

    throw new Error('수업 정보를 추출할 수 없습니다. 문서 형식을 확인해주세요.')
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
