/**
 * Stub: Jupyter Notebook types for the NotebookEditTool.
 */

/** Cell type discriminator (matches Jupyter nbformat). */
export type NotebookCellType = 'code' | 'markdown' | 'raw'

/** Image data extracted from a cell output. */
export type NotebookOutputImage = {
  image_data: string
  media_type: 'image/png' | 'image/jpeg'
}

/** A single output block from a notebook cell. */
export type NotebookCellOutput = {
  output_type: 'stream' | 'execute_result' | 'display_data' | 'error'
  text?: string | string[]
  data?: Record<string, unknown>
  ename?: string
  evalue?: string
  traceback: string[]
}

/** Processed output ready for tool results. */
export type NotebookCellSourceOutput = {
  output_type: string
  text?: string
  image?: NotebookOutputImage
}

/** A cell in a Jupyter notebook (raw nbformat). */
export type NotebookCell = {
  cell_type: NotebookCellType
  source: string | string[]
  id?: string
  execution_count?: number | null
  outputs?: NotebookCellOutput[]
  metadata?: Record<string, unknown>
}

/** Processed cell source with extracted metadata. */
export type NotebookCellSource = {
  cellType: NotebookCellType
  source: string
  language?: string
  execution_count?: number
  cell_id: string
  outputs?: NotebookCellSourceOutput[]
}

/** Top-level notebook document structure. */
export type NotebookContent = {
  nbformat: number
  nbformat_minor: number
  metadata: {
    kernelspec?: {
      language?: string
      display_name?: string
      name?: string
    }
    language_info?: {
      name?: string
    }
    [key: string]: unknown
  }
  cells: NotebookCell[]
}
