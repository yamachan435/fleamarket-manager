import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAuthenticatedClient } from '@/lib/googleDriveAuth'
import { Readable } from 'stream'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const productId = formData.get('productId') as string
    const productNumber = formData.get('productNumber') as string

    if (!file) {
      return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })
    }

    if (!productNumber) {
      return NextResponse.json({ error: '商品番号がありません' }, { status: 400 })
    }

    // OAuth認証済みクライアントを取得
    const auth = await getAuthenticatedClient()

    if (!auth) {
      console.error('Failed to get authenticated client')
      return NextResponse.json(
        { error: 'Google Driveの認証が必要です。先に認証を行ってください。' },
        { status: 401 }
      )
    }

    const drive = google.drive({ version: 'v3', auth })

    // 商品番号フォルダを検索または作成
    const folderName = productNumber.padStart(4, '0')
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    // フォルダを検索
    let folderId: string
    const searchResponse = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentFolderId ? ` and '${parentFolderId}' in parents` : ''}`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    const existingFolder = searchResponse.data.files?.[0]

    if (existingFolder?.id) {
      folderId = existingFolder.id
    } else {
      // フォルダが存在しない場合は作成
      const folderMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }
      if (parentFolderId) {
        folderMetadata.parents = [parentFolderId]
      }

      const folderResponse = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
        supportsAllDrives: true,
      })

      if (!folderResponse.data.id) {
        return NextResponse.json(
          { error: 'フォルダの作成に失敗しました' },
          { status: 500 }
        )
      }
      folderId = folderResponse.data.id
    }

    // ファイルを商品フォルダにアップロード
    const fileMetadata: any = {
      name: file.name,
      parents: [folderId],
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileStream = Readable.from(fileBuffer)

    const media = {
      mimeType: file.type,
      body: fileStream,
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
      supportsAllDrives: true,
    })

    const driveFile = response.data

    if (!driveFile.id) {
      console.error('No file ID returned:', driveFile)
      return NextResponse.json(
        { error: 'ファイルのアップロードに失敗しました（IDが取得できませんでした）' },
        { status: 500 }
      )
    }

    // アップロードしたファイルを公開設定に
    const permError = await drive.permissions.create({
      fileId: driveFile.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    }).catch(err => err)

    if (permError instanceof Error) {
      console.error('Failed to set public permission:', permError)
      return NextResponse.json(
        { error: 'ファイルの公開設定に失敗しました', details: permError.message },
        { status: 500 }
      )
    }

    // Google Driveの画像を直接表示できるURLを生成
    const directImageUrl = `https://lh3.googleusercontent.com/d/${driveFile.id}`

    return NextResponse.json({
      fileId: driveFile.id,
      driveUrl: directImageUrl,
    })
  } catch (error) {
    console.error('Upload error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack'
    return NextResponse.json(
      {
        error: 'アップロードに失敗しました',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    )
  }
}