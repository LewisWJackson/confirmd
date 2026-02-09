export interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  rating: number;
  category: "investor" | "researcher" | "developer" | "other";
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "I lost a significant chunk of my portfolio because I trusted a YouTuber who swore a token was about to 10x. Confirmd would have shown me that same creator had a 23% accuracy rate on price predictions. Never again.",
    name: "Marcus T.",
    role: "Independent Investor",
    rating: 5,
    category: "investor",
  },
  {
    id: 2,
    quote:
      "The creator accuracy tracking is the feature I didn't know I needed. I can now see which influencers consistently get things right versus who's just pumping their bags. It's completely changed who I pay attention to.",
    name: "Aisha R.",
    role: "DeFi Researcher",
    rating: 5,
    category: "researcher",
  },
  {
    id: 3,
    quote:
      "As someone who manages other people's money, I can't afford to act on unverified claims. Confirmd's evidence ladders give me a clear audit trail for every decision. My clients trust my process more because of it.",
    name: "James K.",
    role: "Portfolio Manager",
    rating: 5,
    category: "investor",
  },
  {
    id: 4,
    quote:
      "I was drowning in crypto newsletters, Twitter threads, and Telegram alerts. I missed the actual important stories because of all the noise. Confirmd cuts through it and surfaces what actually matters with real evidence behind it.",
    name: "Sofia L.",
    role: "Crypto Analyst",
    rating: 5,
    category: "researcher",
  },
  {
    id: 5,
    quote:
      "Every time there's a major FUD event, my whole timeline panics. Confirmd lets me check the actual evidence within minutes instead of reacting emotionally. It's saved me from at least three panic sells this year.",
    name: "Daniel W.",
    role: "Independent Investor",
    rating: 5,
    category: "investor",
  },
  {
    id: 6,
    quote:
      "I build DeFi protocols and need to stay informed about regulatory claims and competitor announcements. Most reporting is either hype or doom. Confirmd is the only tool that gives me a measured, evidence-based read on what's actually happening.",
    name: "Priya N.",
    role: "Blockchain Developer",
    rating: 5,
    category: "developer",
  },
  {
    id: 7,
    quote:
      "The source credibility scores alone are worth the subscription. I had no idea how unreliable some of the outlets I was reading actually were until Confirmd showed me their historical accuracy data.",
    name: "Ryan M.",
    role: "Fund Manager",
    rating: 4,
    category: "investor",
  },
  {
    id: 8,
    quote:
      "I recommend Confirmd to every new investor I mentor. The biggest risk in crypto isn't volatility, it's bad information. This platform is the closest thing we have to a fact-checking standard for the industry.",
    name: "Elena V.",
    role: "Digital Asset Consultant",
    rating: 5,
    category: "other",
  },
  {
    id: 9,
    quote:
      "I used to spend two hours every morning cross-referencing claims across multiple sources. Now I open Confirmd, check the verification scores, and I'm done in fifteen minutes. The time savings alone justify the cost.",
    name: "Thomas B.",
    role: "Quantitative Trader",
    rating: 5,
    category: "investor",
  },
  {
    id: 10,
    quote:
      "What I appreciate most is the transparency. You can see exactly why a claim scored the way it did, what evidence supports or contradicts it, and how reliable the sources are. No black boxes.",
    name: "Nadia H.",
    role: "DeFi Researcher",
    rating: 5,
    category: "researcher",
  },
  {
    id: 11,
    quote:
      "After getting burned by a coordinated pump based on fake partnership announcements, I started using Confirmd religiously. The real-time alerts for claims related to my holdings are incredibly valuable.",
    name: "Chris P.",
    role: "Independent Investor",
    rating: 5,
    category: "investor",
  },
  {
    id: 12,
    quote:
      "I write smart contracts and I need accurate information about protocol changes and governance proposals. The amount of misinformation in crypto governance is staggering. Confirmd helps me verify before I build.",
    name: "Kai J.",
    role: "Smart Contract Developer",
    rating: 4,
    category: "developer",
  },
  {
    id: 13,
    quote:
      "The blindspot reports opened my eyes. I realized I was only consuming news from sources that confirmed my existing biases. Confirmd showed me what I was missing and helped me build a more balanced information diet.",
    name: "Olivia S.",
    role: "Crypto Analyst",
    rating: 5,
    category: "researcher",
  },
  {
    id: 14,
    quote:
      "I manage a crypto fund and our due diligence process now starts with Confirmd. Before we even look at a project, we check the verification scores on every major claim. It's become an essential part of our workflow.",
    name: "Andre G.",
    role: "Fund Manager",
    rating: 5,
    category: "investor",
  },
  {
    id: 15,
    quote:
      "Honestly, I was skeptical at first. Another crypto tool making big promises. But after a month of using it, I can't imagine going back. The creator accuracy tracking has fundamentally changed how I evaluate information.",
    name: "Rachel D.",
    role: "Independent Investor",
    rating: 4,
    category: "investor",
  },
  {
    id: 16,
    quote:
      "I'm tired of every crypto media outlet having an obvious agenda. Confirmd's methodology is transparent and algorithmic. It doesn't care about narratives, it cares about evidence. That's exactly what this space needs.",
    name: "Victor C.",
    role: "Blockchain Developer",
    rating: 5,
    category: "developer",
  },
  {
    id: 17,
    quote:
      "The daily briefing feature is perfect. Instead of scrolling through hundreds of posts trying to figure out what's real, I get a concise summary of verified developments. It respects my time.",
    name: "Lauren F.",
    role: "Digital Asset Consultant",
    rating: 5,
    category: "other",
  },
  {
    id: 18,
    quote:
      "I advise institutional clients on digital asset strategy. The ability to show them evidence-based verification of market claims has elevated the quality of our research output significantly.",
    name: "Michael Z.",
    role: "Institutional Research Analyst",
    rating: 5,
    category: "researcher",
  },
  {
    id: 19,
    quote:
      "My biggest frustration with crypto news was never knowing if a breaking story was actually confirmed or just speculation being reported as fact. Confirmd solves this problem better than anything else I've tried.",
    name: "Sarah K.",
    role: "Independent Investor",
    rating: 5,
    category: "investor",
  },
  {
    id: 20,
    quote:
      "I've been in crypto since 2017 and I've watched the information landscape get progressively worse. More noise, more agendas, more misinformation. Confirmd is the antidote. It's the tool I wish existed five years ago.",
    name: "David A.",
    role: "Crypto Analyst",
    rating: 4,
    category: "researcher",
  },
];

export default testimonials;
