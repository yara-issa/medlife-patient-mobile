const EMAILJS_PUBLIC_KEY = "hdcxou_DrlwR6Z-SG";
const EMAILJS_SERVICE_ID = "service_2ilyfta";
const EMAILJS_TEMPLATE_ID = "template_5fklaft";

async function ejsSend(params) {
  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PUBLIC_KEY,
      template_params: params,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error("EmailJS error (" + response.status + "): " + text);
  }
}

export async function sendOTP(toEmail, otpCode) {
  await ejsSend({ to_email: toEmail, otp_code: otpCode });
}

export async function sendAppointmentReminder(toEmail, patientName, doctorName, appointmentDate, appointmentTime) {
  await ejsSend({
    to_email: toEmail,
    otp_code: "REMINDER",
    message: `Dear ${patientName}, this is a reminder that you have an upcoming appointment with ${doctorName} on ${appointmentDate} at ${appointmentTime}. Please arrive 10 minutes early.`,
    patient_name: patientName,
    doctor_name: doctorName,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
  });
}

export function generateOTP() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}
