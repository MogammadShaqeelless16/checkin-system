const fs = require("fs");
const Bottleneck = require("bottleneck");
const nodemailer = require("nodemailer");
const { AppendRowInCSV } = require("./generate");
require("dotenv").config();

const sender_address = 'shaqeelless4@gmail.com';
const sender_password = 'tmac zfwo xdin hasq';

const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000,
});

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: sender_address,
        pass: sender_password,
    },
});

const send_simple_mail = limiter.wrap(function (receiver_address, mail_content, mail_subject) {
    return transporter.sendMail({
        from: sender_address,
        to: receiver_address,
        subject: mail_subject,
        text: mail_subject,
        html: mail_content,
    }).then((info) => {
        console.log("Message is being sent to:", receiver_address);
    }).catch((err) => {
        console.error(`Failed to send message to ${receiver_address}:`, err);
        AppendRowInCSV("data/error.csv", { email: receiver_address, error: err.message });
    });
});

const send_mail_to_list = limiter.wrap(function (receiver_list, mail_content, mail_subject) {
    receiver_list.forEach((email) => {
        send_simple_mail(email, mail_content, mail_subject);
    });
});

const send_mail_with_attachment = limiter.wrap(function (receiver_address, mail_content, mail_subject, attachment) {
    return transporter.sendMail({
        from: sender_address,
        to: receiver_address,
        subject: mail_subject,
        text: mail_subject,
        html: mail_content,
        attachments: [
            {
                filename: attachment.name,
                path: attachment.path,
            },
        ],
    }).then((info) => {
        console.log("Message is being sent to:", receiver_address);
    }).catch((err) => {
        console.error(`Failed to send message to ${receiver_address}:`, err);
        AppendRowInCSV("data/error.csv", { email: receiver_address, error: err.message });
    });
});

const send_mail_to_list_with_attachment = limiter.wrap(function (receiver_list, mail_content, mail_subject, attachment) {
    receiver_list.forEach((email) => {
        send_mail_with_attachment(email, mail_content, mail_subject, attachment);
    });
});

const send_email_accepted = limiter.wrap(function (accepted_participant, mail_subject, mail_content, attachments) {
    const content = mail_content.replace("{{username}}", accepted_participant.username);
    return transporter.sendMail({
        from: sender_address,
        to: accepted_participant.email,
        subject: mail_subject,
        text: mail_subject,
        html: content,
        attachments: attachments.map((attachment) => ({
            filename: attachment.name,
            path: attachment.path,
        })),
    }).then(async () => {
        await AppendRowInCSV("data/success.csv", accepted_participant);
        console.log("✅ Message sent to: ", accepted_participant.email);
    }).catch(async (err) => {
        await AppendRowInCSV("data/error.csv", accepted_participant);
        console.error(`❌ Error sending message to: ${accepted_participant.email}:`, err);
    });
});

const send_emails_accepted = limiter.wrap(function (accepted_participants, mail_subject, mail_content, attachments) {
    accepted_participants.forEach((participant) => {
        send_email_accepted(participant, mail_subject, mail_content, attachments);
    });
});

module.exports = {
    send_simple_mail,
    send_mail_to_list,
    send_mail_with_attachment,
    send_mail_to_list_with_attachment,
    send_email_accepted,
    send_emails_accepted,
};
