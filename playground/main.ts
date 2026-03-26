import { j } from '../src/index';

const app = document.getElementById('app')!;

console.log('%c Jaga Security Playground ', 'background: #222; color: #bada55; font-size: 20px;');

// 1. Text Escaping Test
const textXSS = '<img src=x onerror=alert("Text-XSS")>';
app.innerHTML += j`<h2>1. Text Escaping</h2><div>${textXSS}</div>`.toString();

// 2. URL Blocking Test (Watch Console!)
const maliciousURL = "javascript:alert('URL-XSS')";
app.innerHTML += j`<h2>2. URL Blocking</h2><a href="${maliciousURL}">Dangerous Link (Click me)</a>`.toString();

// 3. Attribute Breakout Test (Watch Console!)
const breakoutPayload = 'myid" onclick="alert(\'Attr-XSS\')';
app.innerHTML += j`<h2>3. Attribute Breakout</h2><button id="${breakoutPayload}">Secure Button</button>`.toString();

console.log('Check the console warnings above! 👆');
