import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import NFTBox from "./NFTBox"
import Link from "next/link"

interface NFTItem {
    rindexerId:string
    seller:string
    nftAddress:string
    price:string
    contractAddress:string
    tokenId:string
    txHash:string
    blockNumber:string
}

interface NFTQueryResponse {
    data: {
        allItemListeds:{
            nodes: NFTItem[]
        },
        allItemCanceleds:{
            nodes: NFTItem[]
        },
        allItemBoughts:{
            nodes: NFTItem[]
        }
    }
}
    
interface BoughtCancelled {
    nftAddress:string
    tokenId:string

}



const GET_RECENT_NFTS = `
query AllItemListeds {
  
  allItemListeds(first: 20, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
    nodes {
      seller
      nftAddress
      tokenId
      price
      contractAddress
      txHash
    }
  }
  allItemCanceleds {
    nodes {
    tokenId
    nftAddress
    }
  }
  allItemBoughts {
    nodes {
    tokenId
    nftAddress
        }
    }
}
`

async function fetchNFTs(): Promise<NFTQueryResponse> {
    const response = await fetch("api/graphql",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: GET_RECENT_NFTS,
        }),
        
    })

    return response.json()
}

function useRecentlyListedNFTs() {
    const { data, isLoading, isError } = useQuery<NFTQueryResponse>({
        queryKey: ["recentNfts"],
        queryFn: fetchNFTs,
    })

    const nftDataList = useMemo(() => {
        if (!data) return []
        const boughtNFTs = new Set<string>()
        const canceledNFTs = new Set<string>()
        data.data.allItemBoughts.nodes.forEach((item) => {
            boughtNFTs.add(`${item.nftAddress}-${item.tokenId}`)
        })
        data.data.allItemCanceleds.nodes.forEach((item) => {
            canceledNFTs.add(`${item.nftAddress}-${item.tokenId}`)
        })
        const availNfts = data.data.allItemListeds.nodes.filter((item) => {
            if (!item.nftAddress || !item.tokenId) return false
            const key = `${item.nftAddress}-${item.tokenId}`
            return !boughtNFTs.has(key) && !canceledNFTs.has(key)
        })

        const recentNfts = availNfts.slice(0,100)

        return recentNfts.map(nft => {
            return {tokenId:nft.tokenId,
            contractAddress:nft.nftAddress,
            price:nft.price}
        })
    }, [data]);

    return {
        isLoading,
        isError,
        nftDataList
    }
}

// Main component that uses the custom hook
export default function RecentlyListedNFTs() {
    const { isLoading, isError, nftDataList } = useRecentlyListedNFTs()

    if (isLoading) {
        return <div>Loading...</div>
}

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mt-8 text-center">
                <Link
                    href="/list-nft"
                    className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    List Your NFT
                </Link>
            </div>
            <h2 className="text-2xl font-bold mb-6">Recently Listed NFTs</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
               {nftDataList.map(nft => 
                <Link href={`/buy-nft/${nft.contractAddress}/${nft.tokenId}`} key={`${nft.contractAddress}-${nft.tokenId}`}>
                    <NFTBox key={`${nft.contractAddress}-${nft.tokenId}`} 
                                                            contractAddress={nft.contractAddress} 
                                                            tokenId={nft.tokenId} 
                                                            price={nft.price} />
                </Link>
               )}
            </div>
        </div>
    )
}