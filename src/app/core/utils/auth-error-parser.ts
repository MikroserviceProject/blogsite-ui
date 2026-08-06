export interface ParsedAuthError {
  title: string;
  generalMessage: string;
  passwordErrors: string[];
  emailErrors: string[];
  usernameErrors: string[];
  otherErrors: string[];
  isPasswordError: boolean;
}

export function parseAuthError(err: any, fallbackMessage?: string): ParsedAuthError {
  let title = '⚠️ İşlem Sırasında Hata Oluştu';
  let generalMessage = fallbackMessage || 'Lütfen girdiğiniz bilgileri kontrol edip tekrar deneyiniz.';
  const passwordErrors: string[] = [];
  const emailErrors: string[] = [];
  const usernameErrors: string[] = [];
  const otherErrors: string[] = [];

  if (!err) {
    return {
      title,
      generalMessage,
      passwordErrors,
      emailErrors,
      usernameErrors,
      otherErrors,
      isPasswordError: false
    };
  }

  const errBody = err.error || err;

  // 1. Dize (String) formatındaki hata
  if (typeof errBody === 'string') {
    classifyErrorString(errBody, passwordErrors, emailErrors, usernameErrors, otherErrors);
  } 
  // 2. Nesne (Object) formatındaki hata (ASP.NET ValidationProblemDetails veya ApiResponse)
  else if (typeof errBody === 'object') {
    if (errBody.message && typeof errBody.message === 'string') {
      generalMessage = errBody.message;
      classifyErrorString(errBody.message, passwordErrors, emailErrors, usernameErrors, otherErrors);
    }

    if (errBody.errors) {
      // Eğer errors bir Array ise
      if (Array.isArray(errBody.errors)) {
        errBody.errors.forEach((e: any) => {
          if (typeof e === 'string') {
            classifyErrorString(e, passwordErrors, emailErrors, usernameErrors, otherErrors);
          }
        });
      } 
      // Eğer errors bir Dictionary/Object ise (ASP.NET ModelState)
      else if (typeof errBody.errors === 'object') {
        for (const [field, val] of Object.entries(errBody.errors)) {
          const fieldLower = field.toLowerCase();
          const msgs: string[] = Array.isArray(val) ? (val as string[]) : [String(val)];

          msgs.forEach(m => {
            if (fieldLower.includes('password') || fieldLower.includes('sifre')) {
              passwordErrors.push(m);
            } else if (fieldLower.includes('email') || fieldLower.includes('eposta') || fieldLower.includes('posta')) {
              emailErrors.push(m);
            } else if (fieldLower.includes('user') || fieldLower.includes('kullanici')) {
              usernameErrors.push(m);
            } else {
              otherErrors.push(m);
            }
          });
        }
      }
    }
  }

  const isPasswordError = passwordErrors.length > 0;

  if (isPasswordError) {
    title = '🔒 Şifre Güvenlik Hatası';
    generalMessage = 'Girdiğiniz şifre güvenlik kurallarına uymuyor. Lütfen aşağıdaki kurallara dikkat ediniz:';
  } else if (emailErrors.length > 0) {
    title = '📧 E-Posta Hatası';
    generalMessage = emailErrors[0];
  } else if (usernameErrors.length > 0) {
    title = '👤 Kullanıcı Adı Hatası';
    generalMessage = usernameErrors[0];
  } else if (otherErrors.length > 0) {
    title = '⚠️ Doğrulama Hatası';
    generalMessage = otherErrors[0];
  }

  return {
    title,
    generalMessage,
    passwordErrors: [...new Set(passwordErrors)],
    emailErrors: [...new Set(emailErrors)],
    usernameErrors: [...new Set(usernameErrors)],
    otherErrors: [...new Set(otherErrors)],
    isPasswordError
  };
}

function classifyErrorString(
  msg: string,
  passwords: string[],
  emails: string[],
  usernames: string[],
  others: string[]
) {
  const m = msg.toLowerCase();
  if (m.includes('şifre') || m.includes('sifre') || m.includes('password') || (m.includes('karakter') && (m.includes('büyük') || m.includes('küçük') || m.includes('rakam') || m.includes('özel')))) {
    passwords.push(msg);
  } else if (m.includes('e-posta') || m.includes('eposta') || m.includes('email') || m.includes('mail')) {
    emails.push(msg);
  } else if (m.includes('kullanıcı adı') || m.includes('username')) {
    usernames.push(msg);
  } else {
    others.push(msg);
  }
}
