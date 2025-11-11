const {RecaptchaEnterpriseServiceClient} = require('@google-cloud/recaptcha-enterprise');

const client = new RecaptchaEnterpriseServiceClient();

async function verifyRecaptcha(token, expectedAction) {
  const projectID = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const recaptchaKey = process.env.RECAPTCHA_SITE_KEY;
  const projectPath = client.projectPath(projectID);

  const request = {
    assessment: {
      event: {
        token: token,
        siteKey: recaptchaKey,
      },
    },
    parent: projectPath,
  };

  try {
    const [response] = await client.createAssessment(request);

    if (!response.tokenProperties.valid) {
      console.log(`Token invalid: ${response.tokenProperties.invalidReason}`);
      return { valid: false, score: 0 };
    }

    if (response.tokenProperties.action !== expectedAction) {
      console.log('Action mismatch');
      return { valid: false, score: 0 };
    }

    return {
      valid: true,
      score: response.riskAnalysis.score,
      reasons: response.riskAnalysis.reasons
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { valid: false, score: 0 };
  }
}

module.exports = { verifyRecaptcha };
