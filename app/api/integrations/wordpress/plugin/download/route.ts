import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readdirSync, statSync, createReadStream } from 'fs';
import { join } from 'path';
import archiver from 'archiver';
import { Readable } from 'stream';

// GET /api/integrations/wordpress/plugin/download - Download WordPress plugin as ZIP
export async function GET(req: NextRequest) {
  try {
    const pluginDir = join(process.cwd(), 'wordpress-plugin', 'rankyak-integration');
    
    if (!existsSync(pluginDir)) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Helper function to add directory recursively
    function addDirectory(dir: string, baseDir: string) {
      const files = readdirSync(dir);
      
      for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
          addDirectory(filePath, baseDir);
        } else {
          const relativePath = filePath.replace(baseDir + '/', '');
          archive.file(filePath, { name: `rankyak-integration/${relativePath}` });
        }
      }
    }

    // Add all files from plugin directory
    addDirectory(pluginDir, pluginDir);

    // Set response headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', 'attachment; filename="rankyak-integration.zip"');

    // Create a readable stream from archiver
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk: Buffer) => {
          controller.enqueue(chunk);
        });

        archive.on('end', () => {
          controller.close();
        });

        archive.on('error', (err: Error) => {
          controller.error(err);
        });

        // Finalize the archive
        archive.finalize();
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error: any) {
    console.error('[WordPress Plugin] Download error:', error);
    return NextResponse.json(
      { error: 'Failed to create plugin package: ' + error.message },
      { status: 500 }
    );
  }
}

