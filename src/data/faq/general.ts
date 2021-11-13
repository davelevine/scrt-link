const general = [
  {
    id: 'why',
    category: 'general',
    heading: 'Why should I use this service?',
    body: `
Sharing secrets is delicate. You don't want sensitive information (confidential information, passwords, API keys, access tokens, key combinations, confessions, etc.) to stay in your Slack channel, Whatsapp chat log, inbox, or any other communication channel. A one-time disposable link guarantees that your secret is only viewed exactly once, before being permanently destroyed.

**Use this service in case you want to…**
- Share your Netflix password with a family member.
- Send a private message from a public computer.
- Send access tokens, API keys, PIN codes to a coworker.
- Confess to a secret crush.
- Transmit information that could be used against you.
`,
  },
  {
    id: 'who',
    category: 'general',
    heading: 'Who is it for?',
    body: `Essentially everybody. Everybody should care about privacy.  
  The means to transmit sensitive information anonymously is especially crucial for journalists, lawyers, politicians, whistleblowers, people who are being oppressed, etc.
`,
  },
  {
    id: 'how',
    category: 'general',
    heading: 'How does the service work?',
    body: `
After you submit the form your secret will be encrypted and stored. You can now share the generated short link via text message, email or whatever service you trust. (We recommend Signal, Threema or Matrix.) After the recipients clicks the link, the message gets displayed and permanently removed from the database. 
    
For **extra security**, you can include a password that will be needed to decrypt the message. (We recommend to share the password via a different channel than the link.)`,
  },
  {
    id: 'difference-to-disappearing-messages',
    category: 'general',
    heading: `What is the difference to disappearing messages on Signal or Whatsapp?`,
    body: `Anonymity, privacy and security. Plain text messages within a chat log can always get traced back to you. There are many scenarios where even disappearing messages are a risk factor: Do other people have access to your phone sometimes? What if you lost your phone? Or even worse, your phone might be compromised on an operating system level. With scrt.link you will always just have a link in your conversation history. After the link has been visited once, it will lead to a 404 error page. There is no way of accessing the original content.
`,
  },
  {
    id: 'difference-to-snapchat',
    category: 'general',
    heading: `What is the difference to Snapchat?`,
    body: `Same answer as for the previous question. Also, the business model behind Snapchat, and every other major social media platform, contradicts the idea of privacy and anonymity. Social media companies need to know their users in order to sell ads. 
    
However, it is fine to share a generated secret link using Snapchat, Facebook, Instagram, Telegram, etc.
`,
  },
]

export default general