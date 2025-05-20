"use client"

import { useAccount } from "wagmi"
import RecentlyListedNFTs from "@/components/RecentlyListed"
import { useEffect, useState } from "react"


export default function Home() {
    const { isConnected } = useAccount()
    const [isCompliant, setIsCompliant] = useState(true)

    const { address } = useAccount()
    useEffect(() => {
            if (address){
                checkCompliance()
            }
        }, [address])
    
    async function checkCompliance() {
        if (!address) return

        const response = await fetch("/api/compliance", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ address }),
        })

        const result = await response.json()
        setIsCompliant(result.success && result.isApproved)
        
    }

    return (
        <main>
            {!isConnected ? (
                <div className="flex items-center justify-center p-4 md:p-6 xl:p-8">
                    Please connect a wallet
                </div>
            ) : (
                isCompliant ? (
                <div className="flex items-center justify-center p-4 md:p-6 xl:p-8">
                    <RecentlyListedNFTs />
                </div>) : (
                    <div>
                        You are denied !!! 
                    </div>
                )
            )}
        </main>
    )
}
