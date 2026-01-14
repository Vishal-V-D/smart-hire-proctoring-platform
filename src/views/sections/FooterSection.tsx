"use client"

import { Code, ArrowRight, Twitter, Linkedin, Github } from 'lucide-react';

export default function FooterSection({ userHref }: { userHref: string }) {
    return (
        <footer className="bg-zinc-950 pt-24 pb-12 border-t border-white/5 relative z-10">
            <div className="container mx-auto px-6 md:px-12 text-center mb-20">
                <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-600">
                    Ready to build your <br /> dream engineering team?
                </h2>
                <a href={userHref} className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors shadow-none">
                    Start Assessing Now <ArrowRight size={18} />
                </a>
            </div>

            <div className="container mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm border-t border-white/10 pt-12">
                <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center"><Code size={14} className="text-black" /></div>
                        <span className="text-lg font-bold text-white">CodeAssess.io</span>
                    </div>
                    <p className="text-zinc-500 mb-6 pr-8">The leading technical assessment platform for identifying and hiring top developer talent.</p>
                    <div className="flex gap-4 text-zinc-400">
                        <a href="#" className="hover:text-white"><Twitter size={20} /></a>
                        <a href="#" className="hover:text-white"><Linkedin size={20} /></a>
                        <a href="#" className="hover:text-white"><Github size={20} /></a>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold mb-4 text-white">Platform</h4>
                    <ul className="space-y-2 text-zinc-400">
                        <li><a href="#" className="hover:text-white">Coding Challenges</a></li>
                        <li><a href="#" className="hover:text-white">System Design</a></li>
                        <li><a href="#" className="hover:text-white">Proctoring</a></li>
                        <li><a href="#" className="hover:text-white">Integrations</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4 text-white">Resources</h4>
                    <ul className="space-y-2 text-zinc-400">
                        <li><a href="#" className="hover:text-white">Customer Stories</a></li>
                        <li><a href="#" className="hover:text-white">Hiring Guides</a></li>
                        <li><a href="#" className="hover:text-white">Blog</a></li>
                        <li><a href="#" className="hover:text-white">Help Center</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4 text-white">Company</h4>
                    <ul className="space-y-2 text-zinc-400">
                        <li><a href="#" className="hover:text-white">About Us</a></li>
                        <li><a href="#" className="hover:text-white">Careers</a></li>
                        <li><a href="#" className="hover:text-white">Contact</a></li>
                        <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                    </ul>
                </div>
            </div>
            <div className="container mx-auto px-6 md:px-12 mt-12 text-center text-zinc-600 text-xs">
                <p>© 2024 CodeAssess.io. All rights reserved.</p>
            </div>
        </footer>
    );
}
