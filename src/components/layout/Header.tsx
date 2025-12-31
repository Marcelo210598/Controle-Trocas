'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    ArrowLeftRight,
    Plus,
    Menu,
    X,
    Package
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/trocas', label: 'Trocas', icon: ArrowLeftRight },
    { href: '/trocas/nova', label: 'Nova Troca', icon: Plus },
]

export function Header() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Package className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-xl hidden sm:inline-block">Controle de Trocas</span>
                    <span className="font-bold text-xl sm:hidden">Trocas</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                pathname === item.href
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Navigation */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild className="md:hidden">
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72">
                        <div className="flex flex-col gap-4 mt-8">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                                        pathname === item.href
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    )
}
