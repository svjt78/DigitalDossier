// lib/emailTemplates.js
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import mjml2html from 'mjml';

const TEMPLATES_DIR = path.join(process.cwd(), 'emails');

function compileTemplate(name) {
  const raw = fs.readFileSync(path.join(TEMPLATES_DIR, `${name}.mjml`), 'utf8');
  const template = Handlebars.compile(raw);
  return (locals) => {
    const filled = template(locals);
    const { html } = mjml2html(filled, { validationLevel: 'strict' });
    return html;
  };
}

export const renderSubscriptionConfirm = compileTemplate('subscription-confirm');
export const renderResetRequest       = compileTemplate('reset-password-request');
export const renderSignupConfirm      = compileTemplate('signup-confirm');
export const renderCommentAlert       = compileTemplate('comment-alert');
