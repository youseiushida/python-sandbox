from fastapi import FastAPI
from pydantic import BaseModel, Field   
import io
from contextlib import redirect_stdout, redirect_stderr
import traceback

app = FastAPI()

async def _run(code_string):
    """
    Python文字列を実行する関数
    
    Args:
        code_string (str): 実行するPythonコード
    
    Returns:
        dict: 実行結果を含む辞書
    """
    result = {
        'success': False,
        'output': '',
        'error': '',
        'return_value': None
    }
    
    try:
        # 標準出力・エラー出力をキャプチャ
        stdout_buffer = io.StringIO()
        stderr_buffer = io.StringIO()
        
        with redirect_stdout(stdout_buffer), redirect_stderr(stderr_buffer):
            # exec()を使用してコードを実行
            exec_globals = {}
            exec(code_string, exec_globals)
            
        result['output'] = stdout_buffer.getvalue()
        result['error'] = stderr_buffer.getvalue()
            
        result['success'] = True
        
    except Exception as e:
        result['error'] = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        
    return result

class PythonRequest(BaseModel):
    code: str = Field(..., description="Python code to run")


@app.post("/run")
async def run_command(payload: PythonRequest):
    return await _run(payload.code)

@app.get("/health")
async def health():
    return {"status": "ok"}
