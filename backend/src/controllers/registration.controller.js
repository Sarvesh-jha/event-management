const registrationService = require('../services/registration.service');

const registerForEvent = async (req, res) => {
  const registration = await registrationService.registerForEvent({
    eventId: req.params.eventId,
    userId: req.user.id,
    note: req.body.note,
  });

  res.status(201).json({
    success: true,
    message: registration.message,
    data: registration,
  });
};

const getMyRegistrations = async (req, res) => {
  const registrations = await registrationService.getMyRegistrations(req.user.id);

  res.status(200).json({
    success: true,
    data: registrations,
  });
};

const getMyRegistrationForEvent = async (req, res) => {
  const registration = await registrationService.getMyRegistrationForEvent({
    eventId: req.params.eventId,
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    data: registration,
  });
};

const verifyCheckIn = async (req, res) => {
  const result = await registrationService.verifyCheckIn({
    qrCodeToken: req.body.qrCodeToken,
    adminUserId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: result.message,
    data: result,
  });
};

const downloadCertificate = async (req, res) => {
  const certificate = await registrationService.generateCertificate({
    registrationId: req.params.registrationId,
    userId: req.user.id,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${certificate.filename}"`,
  );
  res.status(200).send(certificate.buffer);
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  getMyRegistrationForEvent,
  verifyCheckIn,
  downloadCertificate,
};
