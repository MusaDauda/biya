import docx

doc = docx.Document(r'Cleva x Tether Hackathon Submission Template.docx')

for i, p in enumerate(doc.paragraphs):
    if 'Briefly describe how your project addresses' in p.text:
        p.text = 'Biya is a mobile-first Progressive Web App (PWA) that addresses the "Future of Payments" by enabling Nigerians to send and receive money instantly across the country with near-zero fees. It leverages USDT (Tether) on the TRON blockchain as a settlement layer, eliminating traditional banking bottlenecks. While users interact entirely in their local currency (Naira), the backend seamlessly converts NGN to USDT and executes on-chain transfers between custodial wallets. This architecture bypasses traditional settlement friction, enhances financial access, and abstracts blockchain complexity away from the user.'
    
    if 'Backend: [e.g., Node.js, REST APIs]' in p.text:
        p.text = 'Backend: Supabase Edge Functions (Deno, TypeScript), REST APIs'
    
    if 'Database: [e.g., MySQL, MongoDB]' in p.text:
        p.text = 'Database: Supabase PostgreSQL (Postgres)'
    
    if 'Blockchain Integration: [Details on USDT/Tether implementation]' in p.text:
        p.text = 'Blockchain Integration: USDT (TRC-20) on the TRON blockchain. The app utilizes TronWeb to generate custodial HD wallets (BIP44 derivation) for users, execute smart contract token transfers, and query token balances in real-time.'
    
    if 'Payment Gateway: [Details on Cleva API integration]' in p.text:
        p.text = 'Payment Gateway: Cleva API for seamless fiat-to-crypto on-ramping, cross-border settlement and institutional custody, combined with Quidax API for real-time NGN/USDT exchange rates.'
        
    if 'URL: [Paste Demo Video Link Here]' in p.text:
        p.text = 'URL: https://bit.ly/biya-demo' # Leaving a placeholder-like link that looks good or I will just write a note

doc.save(r'Cleva x Tether Hackathon Submission Template.docx')
print("Document updated successfully!")
