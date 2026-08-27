import { NextResponse } from 'next/server';

export const maxDuration = 60; 

// Helper function to fetch real-time weather dynamically
async function getRealTimeWeather(cityName) {
    try {
        const apiKey = "nrv550ngnwo9vd4fdji129lpy7wlxk2xpn12czq0";
        
        // 1. Search for the city's exact place_id
        const findUrl = `https://www.meteosource.com/api/v1/free/find_places_prefix?text=${encodeURIComponent(cityName)}&key=${apiKey}`;
        const findRes = await fetch(findUrl);
        const findData = await findRes.json();
        
        if (!findData || findData.length === 0) {
            return `Could not find weather data for the city: ${cityName}.`;
        }
        
        const placeId = findData[0].place_id;
        
        // 2. Fetch the weather using that place_id
        const weatherUrl = `https://www.meteosource.com/api/v1/free/point?place_id=${placeId}&sections=current&timezone=UTC&language=en&units=metric&key=${apiKey}`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        return `Current Weather in ${findData[0].name}: ${weatherData.current.temperature}°C, ${weatherData.current.summary}. Wind: ${weatherData.current.wind.speed}m/s.`;
    } catch (e) {
        return `Weather data currently unavailable for ${cityName}.`;
    }
}

export async function POST(req) {
    try {
        const { message } = await req.json();

        // Standard System Prompt
        const systemPrompt = `You are a helpful AI guide for Hokkaido, Japan. 
        You answer questions about disasters, transportation, and weather.
        Always use the get_weather_for_city tool if the user asks for the weather.
        You must answer with bullet points instead of table format.
        `;

        let messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ];

        // Define the tool for the LLM
        const tools = [
            {
                type: "function",
                function: {
                    name: "get_weather_for_city",
                    description: "Fetch the current real-time weather for ANY city in the world.",
                    parameters: {
                        type: "object",
                        properties: {
                            city: { 
                                type: "string", 
                                description: "The name of the city, e.g. Sapporo, Tokyo, London, Niseko" 
                            }
                        },
                        required: ["city"]
                    }
                }
            }
        ];

        // Step 1: Send the user's message to Groq (with tools enabled)
        let groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b',
                messages: messages,
                tools: tools,
                tool_choice: 'auto'
            })
        });

        let groqData = await groqResponse.json();
        if (groqData.error) throw new Error(groqData.error.message);

        const responseMessage = groqData.choices[0].message;

        // Step 2: Check if the AI decided it needs to use the tool!
        if (responseMessage.tool_calls) {
            // Append the AI's tool call request to the chat history
            messages.push(responseMessage); 

            // Execute the tool (fetch the weather)
            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.function.name === 'get_weather_for_city') {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`AI requested weather for: ${args.city}`);
                    
                    const weatherInfo = await getRealTimeWeather(args.city);
                    
                    // Return the data back to the AI
                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: "get_weather_for_city",
                        content: weatherInfo
                    });
                }
            }

            // Step 3: Send the weather data back to the AI for its final answer
            const finalResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-20b',
                    messages: messages
                })
            });

            const finalData = await finalResponse.json();
            return NextResponse.json({ reply: finalData.choices[0].message.content });
        
        } else {
            // The AI didn't need the tool (just normal conversation)
            return NextResponse.json({ reply: responseMessage.content });
        }

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ reply: error.message }, { status: 500 });
    }
}
