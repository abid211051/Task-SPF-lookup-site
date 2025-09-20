import dns from "node:dns";

const domain = "netlify.com";

const res = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
const data = await res.json();

console.log(data);

// dns.resolveTxt(domain, (err, addr) => {
//   console.log(addr);
// });
