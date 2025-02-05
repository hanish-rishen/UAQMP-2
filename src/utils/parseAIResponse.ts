export function parseAIResponse(aiResponse: string) {
  try {
    // Split by section headers
    const sections = aiResponse.split(/(?:AIR QUALITY ASSESSMENT|HEALTH RECOMMENDATIONS|WEATHER IMPACT ANALYSIS):/i);
    
    // Remove empty strings and trim each section
    const cleanSections = sections.filter(Boolean).map(s => s.trim());

    // Convert bullet points to array items
    const convertBulletPoints = (text: string) => 
      text.split('\n')
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(Boolean);

    return {
      assessment: cleanSections[0] || 'No assessment available',
      recommendations: cleanSections[1] ? convertBulletPoints(cleanSections[1]) : [],
      weatherImpact: cleanSections[2] ? convertBulletPoints(cleanSections[2]) : []  // renamed from weather to weatherImpact
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      assessment: 'Error processing air quality insights',
      recommendations: [],
      weatherImpact: []
    };
  }
}
