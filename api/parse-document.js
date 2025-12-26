/**
 * Vercel Serverless Function: Document Parse
 * Upstage Document Parse API + Solar Pro2를 사용하여 지도일지 파싱
 */

export const config = {
    runtime: 'edge',
    maxDuration: 60
}

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const { fileName, fileData, fileType } = await request.json()
        const UPSTAGE_API_KEY = process.env.UPSTAGE_API_KEY

        if (!UPSTAGE_API_KEY) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // 1. Upstage Document Parse API 호출
        const parseResult = await parseDocumentWithUpstage(fileData, fileName, UPSTAGE_API_KEY)

        // 2. Solar Pro2로 구조화된 데이터 추출
        const lessons = await extractLessonsWithSolar(parseResult.text, UPSTAGE_API_KEY)

        return new Response(JSON.stringify({ lessons }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: error.message || 'Document parsing failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

/**
 * Upstage Document Parse API 호출
 */
async function parseDocumentWithUpstage(base64Data, fileName, apiKey) {
    // Base64를 Blob으로 변환
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    const blob = new Blob([binaryData])

    // FormData 생성
    const formData = new FormData()
    formData.append('document', blob, fileName)
    formData.append('output_formats', JSON.stringify(['text']))
    formData.append('ocr', 'auto')
    formData.append('model', 'document-parse')

    const response = await fetch('https://api.upstage.ai/v1/document-digitization', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        body: formData
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Document Parse API error: ${error}`)
    }

    const result = await response.json()
    return { text: result.text || result.content?.text || '' }
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
        throw new Error(`Solar Pro2 API error: ${error}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || ''

    // JSON 추출
    try {
        // JSON 블록 찾기
        const jsonMatch = content.match(/\{[\s\S]*"lessons"[\s\S]*\}/)
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            // fullDate를 Date 객체로 변환
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
