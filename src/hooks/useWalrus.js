import { useState, useCallback } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { storeBlob, readBlob, getExplorerUrl } from '../lib/walrus'

export function useWalrus() {
  const currentAccount          = useCurrentAccount()
  const { mutateAsync: signTx } = useSignAndExecuteTransaction()
  const [saving,  setSaving]    = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState(null)

  const signAndExecute = useCallback(async ({ transaction }) => {
    return signTx({
      transaction,
      options: {
        showEffects:       true,
        showObjectChanges: true,
      },
    })
  }, [signTx])

  const save = useCallback(async (data) => {
    if (!currentAccount) {
      throw new Error('No wallet connected')
    }
    setError(null)
    setSaving(true)
    try {
      const blobId = await storeBlob(data, signAndExecute, currentAccount)
      return blobId
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [currentAccount, signAndExecute])

  const load = useCallback(async (blobId) => {
    setError(null)
    setLoading(true)
    try {
      return await readBlob(blobId)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    save,
    load,
    saving,
    loading,
    error,
    getExplorerUrl,
    isConnected: !!currentAccount,
    address:     currentAccount?.address || null,
  }
}