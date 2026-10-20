// Giữ các audience cũ để những đường dẫn đã chia sẻ vẫn mở được thư gia đình.
const VALID_AUDIENCE_TYPES = new Set(['family', 'student', 'visitor', 'classmate', 'close_friend']);
const familyGreetings = import('../../shared/familyGreetings.mjs');

async function generateGreeting(name, audienceType = 'family') {
  if (!VALID_AUDIENCE_TYPES.has(audienceType)) {
    const error = new Error('Invalid audienceType');
    error.statusCode = 400;
    throw error;
  }
  const { getFamilyGreeting } = await familyGreetings;
  return getFamilyGreeting(name);
}

module.exports = { generateGreeting, VALID_AUDIENCE_TYPES };
