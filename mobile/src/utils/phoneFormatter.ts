export function formatPhoneNumber(phoneNumberString: string): string {
 if (!phoneNumberString) return '';
 const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
 const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
 if (match) {
 return '(' + match[1] + ') ' + match[2] + '-' + match[3];
 }
 return phoneNumberString;
}

export function formatIndianPhoneNumber(phoneNumberString: string): string {
 if (!phoneNumberString) return '';
 const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
 if (cleaned.length === 10) {
 return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
 } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
 return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
 }
 return phoneNumberString;
}

export function getDialerHref(phoneNumberString: string): string {
 return `tel:+${phoneNumberString.replace(/\D/g, '')}`;
}
