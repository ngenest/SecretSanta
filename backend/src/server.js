import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

const buildTransport = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined
    });
  }

  return nodemailer.createTransport({ jsonTransport: true });
};

const mailTransport = buildTransport();

const validatePayload = (body) => {
  const errors = [];
  if (!body) {
    errors.push('Body required');
    return errors;
  }

  const { name, date, couples } = body;
  if (!name || typeof name !== 'string') errors.push('Event name is required');
  if (!date || typeof date !== 'string') errors.push('Event date is required');
  if (!Array.isArray(couples) || couples.length !== 4)
    errors.push('Exactly four couples are required');

  const emails = new Set();
  couples?.forEach((couple, coupleIndex) => {
    if (!couple?.participants || couple.participants.length !== 2) {
      errors.push(`Couple ${coupleIndex + 1} must have two participants`);
      return;
    }
    couple.participants.forEach((participant, participantIndex) => {
      if (!participant.name) {
        errors.push(`Participant ${participantIndex + 1} in couple ${coupleIndex + 1} missing name`);
      }
      if (!participant.email) {
        errors.push(`Participant ${participantIndex + 1} in couple ${coupleIndex + 1} missing email`);
      }
      if (participant.email && emails.has(participant.email)) {
        errors.push(`Duplicate email detected: ${participant.email}`);
      }
      if (participant.email) {
        emails.add(participant.email);
      }
    });
  });

  return errors;
};

const derangeParticipants = (participants) => {
  const givers = participants.map((p, index) => ({ ...p, index }));
  let receivers = [...givers];
  let attempts = 0;
  const maxAttempts = 5000;

  const isValid = (giver, receiver) =>
    giver.index !== receiver.index && giver.coupleId !== receiver.coupleId;

  while (attempts < maxAttempts) {
    attempts += 1;
    receivers = receivers
      .map((value) => ({ sortKey: Math.random(), value }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ value }) => value);

    const matches = givers.map((giver, idx) => ({ giver, receiver: receivers[idx] }));
    if (matches.every(({ giver, receiver }) => isValid(giver, receiver))) {
      return matches.map(({ giver, receiver }) => ({ giver, receiver }));
    }
  }

  throw new Error('Unable to generate valid Secret Santa pairings after many attempts.');
};

const sendEmails = async ({ eventName, eventDate, assignments }) => {
  const promises = assignments.map(({ giver, receiver }) => {
    const message = {
      from: process.env.FROM_EMAIL || 'secretsanta@example.com',
      to: giver.email,
      subject: `Secret Santa Match for ${eventName}`,
      text: `Ho ho ho! You will be gifting ${receiver.name} for ${eventName} on ${eventDate}. Keep it secret!`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color:#d32f2f;">Secret Santa Assignment</h2>
          <p>Hi ${giver.name},</p>
          <p>You drew <strong>${receiver.name}</strong> for <strong>${eventName}</strong> on <strong>${eventDate}</strong>.</p>
          <p>Get something merry and bright!</p>
        </div>
      `
    };

    return mailTransport.sendMail(message);
  });

  await Promise.all(promises);
};

app.post('/api/draw', async (req, res) => {
  const validationErrors = validatePayload(req.body);
  if (validationErrors.length) {
    return res.status(400).json({ errors: validationErrors });
  }

  const { name, date, couples } = req.body;
  const participants = couples.flatMap((couple, coupleIndex) =>
    couple.participants.map((participant) => ({
      ...participant,
      coupleId: coupleIndex
    }))
  );

  try {
    const matches = derangeParticipants(participants);
    await sendEmails({
      eventName: name,
      eventDate: date,
      assignments: matches
    });

    const responseAssignments = matches.map(({ giver, receiver }) => ({
      giver: { name: giver.name, email: giver.email },
      receiver: { name: receiver.name }
    }));

    res.json({ assignments: responseAssignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate Secret Santa assignments.' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Secret Santa backend listening on port ${PORT}`);
});
