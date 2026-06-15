import { SuiGrpcClient } from '@mysten/sui/grpc'
import { walrus, WalrusFile } from '@mysten/walrus'
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url'

const MAINNET_AGGREGATOR = 'https://aggregator.walrus-mainnet.walrus.space'
const WALRUS_EXPLORER    = 'https://walruscan.com/mainnet/blob'
export const STORAGE_EPOCHS = 5

// ── Create client using correct pattern from official docs ────────────────────
export const client = new SuiGrpcClient({
  network: 'mainnet',
  baseUrl: 'https://fullnode.mainnet.sui.io:443',
}).$extend(
  walrus({
    wasmUrl: walrusWasmUrl,
    uploadRelay: {
      host:    'https://upload-relay.mainnet.walrus.space',
      sendTip: { max: 10_000_000 },
    },
  })
)

// ── Store JSON blob on Walrus Mainnet ─────────────────────────────────────────
export async function storeBlob(data, signAndExecuteTransaction, currentAccount) {
  if (!currentAccount) throw new Error('No wallet connected')

  const encoded = new TextEncoder().encode(JSON.stringify(data))

  const flow = client.walrus.writeFilesFlow({
    files: [
      WalrusFile.from({
        contents:   encoded,
        identifier: 'grudge-memory.json',
        tags:       { 'content-type': 'application/json' },
      }),
    ],
  })

  await flow.encode()

  // Step 1: Register — wallet signs (pays WAL)
  const registerTx = flow.register({
    epochs:    STORAGE_EPOCHS,
    owner:     currentAccount.address,
    deletable: false,
  })

  const regResult = await signAndExecuteTransaction({ transaction: registerTx })

  if (regResult.$kind === 'FailedTransaction') {
    throw new Error(
      `Register failed: ${regResult.FailedTransaction.status.error?.message}`
    )
  }

  // Step 2: Upload slivers via relay
  await flow.upload({
    digest: regResult.Transaction?.digest || regResult.digest,
  })

  // Step 3: Certify — wallet signs again (finalises on Sui)
  const certifyTx  = flow.certify()
  const certResult = await signAndExecuteTransaction({ transaction: certifyTx })

  if (certResult.$kind === 'FailedTransaction') {
    throw new Error(
      `Certify failed: ${certResult.FailedTransaction.status.error?.message}`
    )
  }

  const files  = await flow.listFiles()
  const blobId = files[0]?.blobId
  if (!blobId) throw new Error('No blob ID returned after upload')
  return blobId
}

// ── Read JSON blob — free, uses public aggregator ─────────────────────────────
export async function readBlob(blobId) {
  if (!blobId || typeof blobId !== 'string') {
    throw new Error('Invalid blob ID')
  }
  const res = await fetch(`${MAINNET_AGGREGATOR}/v1/blobs/${blobId.trim()}`)
  if (!res.ok) throw new Error(`Blob not found (${res.status})`)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Blob content is not valid JSON')
  }
}

export function getExplorerUrl(blobId) {
  return `${WALRUS_EXPLORER}/${blobId}`
}