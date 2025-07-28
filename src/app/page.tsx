
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Star } from "lucide-react";

export default function Home() {
  const testimonials = [
    {
      name: "Ahmed Khan",
      avatar: "https://placehold.co/40x40.png",
      aiHint: "pakistani man",
      title: "Software Engineer, Lahore",
      quote: "Envo Earn is so simple to use. I started with a small investment and have seen consistent returns. The referral bonus is a great incentive too!",
    },
    {
      name: "Fatima Ali",
      avatar: "https://placehold.co/40x40.png",
      aiHint: "woman portrait",
      title: "University Student, Karachi",
      quote: "As a student, I don't have much to invest, but Envo Earn made it possible to start growing my savings. The platform is very trustworthy and transparent.",
    },
    {
      name: "Zainab Malik",
      avatar: "https://placehold.co/40x40.png",
      aiHint: "smiling woman",
      title: "Graphic Designer, Islamabad",
      quote: "I was skeptical at first, but the straightforward process and clear tracking of my earnings won me over. I've already recommended it to all my friends.",
    },
     {
      name: "Bilal Chaudhry",
      avatar: "https://placehold.co/40x40.png",
      aiHint: "man with beard",
      title: "Shop Owner, Faisalabad",
      quote: "The payment process through Easypaisa was very convenient. My investment was approved quickly, and the dashboard makes it easy to see my earnings.",
    },
    {
      name: "Ayesha Hussain",
      avatar: "https://placehold.co/40x40.png",
      aiHint: "woman in hijab",
      title: "Teacher, Rawalpindi",
      quote: "A great platform for people who are new to investing. No hidden fees, and the customer support was very helpful when I had a question.",
    },
    {
      name: "Usman Tariq",
      avatar: "https://placehold.co/40x40.png",
      aiHint: "man professional",
      title: "Banker, Multan",
      quote: "I appreciate the security and the clear, simple interface. It's a reliable way to make my money work for me without any complications.",
    },
     {
      name: "Sana Jahangir",
      avatar: "https://placehold.co/40x40.png",
      aiHint: "professional woman",
      title: "Marketing Manager, Peshawar",
      quote: "The referral program is excellent. I've earned a good amount just by inviting a few colleagues. It's a win-win for everyone involved.",
    },
    {
      name: "Haris Qureshi",
      avatar: "https://placehold.co/40x40.png",
      aiHint: "young man",
      title: "Freelancer, Gujranwala",
      quote: "Finally, an investment app that understands the local market. The process is smooth from start to finish. Highly recommended!",
    },
     {
      name: "Nida Siddiqui",
      avatar: "https://placehold.co/40x40.png",
      aiHint: "woman glasses",
      title: "Doctor, Quetta",
      quote: "Envo Earn is a breath of fresh air. It's simple, secure, and the returns have been exactly as promised. A trustworthy platform for sure.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 bg-background">
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary-foreground">
                Invest with Confidence, Earn with Ease
              </h1>
              <p className="mt-4 text-muted-foreground md:text-xl">
                Join Envo Earn and watch your savings grow. A secure and straightforward way to build your financial future.
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/invest">Invest 6000 PKR</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-20 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-headline font-bold tracking-tighter text-center sm:text-4xl md:text-5xl text-primary-foreground">
              Trusted by Investors Across Pakistan
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl text-center mt-4">
              Hear from our satisfied users who are building their wealth with us.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="flex flex-col">
                  <CardContent className="pt-6 flex-1">
                    <p className="text-muted-foreground">"{testimonial.quote}"</p>
                  </CardContent>
                  <CardFooter className="mt-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={testimonial.avatar} data-ai-hint={testimonial.aiHint} />
                          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-primary-foreground">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                        </div>
                     </div>
                      <div className="flex text-accent">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                      </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-background border-t">
        <div className="container p-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Envo Earn. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
