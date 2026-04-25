import nodemailer from 'nodemailer';
import { Subscriber } from './models/Subscriber.js';
import 'dotenv/config';


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'luka.djordjevic7017@gmail.com',
        pass: process.env.NODEMAILER
    }
});

export async function posaljiNotifikaciju(noviKlijent) {
    const sviKlijenti = await Subscriber.find().sort({ createdAt: -1 });

    const redovi = sviKlijenti.map(k => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;">${k.email}</td>
      <td style="padding:8px;border:1px solid #ddd;">${k.service}</td>
      <td style="padding:8px;border:1px solid #ddd;">${new Date(k.createdAt).toLocaleDateString('sr-RS')}</td>
    </tr>
  `).join('');

    await transporter.sendMail({
        from: 'luka.djordjevic7017@gmail.com',
        to: 'info@isidoraverisugc.com',
        subject: `🔔 Novi klijent: ${noviKlijent.email}`,
        html: `
      <h2 style="color:#333;">Novi klijent se prijavio!</h2>
      <p><b>Email:</b> ${noviKlijent.email}</p>
      <p><b>Usluga:</b> ${noviKlijent.service}</p>
      <p><b>Datum:</b> ${new Date(noviKlijent.createdAt).toLocaleDateString('sr-RS')}</p>
      <hr/>
      <h3>Svi klijenti (ukupno: ${sviKlijenti.length})</h3>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;">
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;border:1px solid #ddd;">Email</th>
          <th style="padding:8px;border:1px solid #ddd;">Usluga</th>
          <th style="padding:8px;border:1px solid #ddd;">Datum</th>
        </tr>
        ${redovi}
      </table>
    `
    });
}