const axios = require('axios');

async function verifyRecaptcha(token, expectedAction) {
  const projectID = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const siteKey = process.env.RECAPTCHA_SITE_KEY;
  const apiKey = process.env.GOOGLE_API_KEY;

  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectID}/assessments?key=${apiKey}`;

  const requestBody = {
    event: {
      token: token,
      expectedAction: expectedAction,
      siteKey: siteKey,
    }
  };

  try {
    const response = await axios.post(url, requestBody);
    const assessment = response.data;

    if (!assessment.tokenProperties?.valid) {
      console.log(`Token invalid: ${assessment.tokenProperties?.invalidReason}`);
      return { valid: false, score: 0 };
    }

    if (assessment.tokenProperties.action !== expectedAction) {
      console.log('Action mismatch');
      return { valid: false, score: 0 };
    }

    return {
      valid: true,
      score: assessment.riskAnalysis?.score || 0,
      reasons: assessment.riskAnalysis?.reasons || []
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error.response?.data || error.message);
    return { valid: false, score: 0 };
  }
}

module.exports = { verifyRecaptcha };
