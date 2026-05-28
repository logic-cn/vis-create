"""
VisCreate CLI入口

提供命令行界面来执行AI视觉创作任务
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

from .agent.core import VisCreateAgent

app = typer.Typer(
    name="vis-create",
    help="AI视觉创作Agent - 专注于AI图片生成和视频生成",
    no_args_is_help=True,
)

console = Console()


def version_callback(value: bool):
    if value:
        console.print(f"[bold green]vis-create[/bold green] v0.1.0")
        raise typer.Exit()


@app.callback()
def main(
    version: bool = typer.Option(
        None, "--version", "-v", callback=version_callback, is_eager=True
    ),
):
    """
    AI视觉创作Agent - 专注于AI图片生成和视频生成的本地Agent产品
    """


@app.command()
def generate(
    prompt: str = typer.Argument(..., help="图片生成提示词"),
    output: str = typer.Option(
        "./output", "--output", "-o", help="输出目录路径"
    ),
    style: str = typer.Option(
        "realistic", "--style", "-s", help="图片风格 (realistic/anime/cartoon/artistic)"
    ),
    size: str = typer.Option(
        "1024x1024", "--size", help="图片尺寸 (宽x高)"
    ),
):
    """
    生成AI图片
    """
    console.print(Panel(f"[bold blue]生成图片[/bold blue]\n提示词: {prompt}"))

    agent = VisCreateAgent()
    result = agent.generate_image(
        prompt=prompt,
        output_dir=output,
        style=style,
        size=size,
    )

    if result.success:
        console.print(f"[bold green]✓ 图片已生成:[/bold green] {result.file_path}")
    else:
        console.print(f"[bold red]✗ 生成失败:[/bold red] {result.error}")


@app.command()
def video(
    prompt: str = typer.Argument(..., help="视频生成提示词"),
    output: str = typer.Option(
        "./output", "--output", "-o", help="输出目录路径"
    ),
    duration: int = typer.Option(
        5, "--duration", "-d", help="视频时长（秒）"
    ),
    fps: int = typer.Option(
        24, "--fps", help="视频帧率"
    ),
):
    """
    生成AI视频
    """
    console.print(Panel(f"[bold blue]生成视频[/bold blue]\n提示词: {prompt}"))

    agent = VisCreateAgent()
    result = agent.generate_video(
        prompt=prompt,
        output_dir=output,
        duration=duration,
        fps=fps,
    )

    if result.success:
        console.print(f"[bold green]✓ 视频已生成:[/bold green] {result.file_path}")
    else:
        console.print(f"[bold red]✗ 生成失败:[/bold red] {result.error}")


@app.command()
def edit(
    image_path: str = typer.Argument(..., help="要编辑的图片路径"),
    instruction: str = typer.Argument(..., help="编辑指令"),
    output: str = typer.Option(
        None, "--output", "-o", help="输出路径（默认覆盖原图）"
    ),
):
    """
    编辑现有图片
    """
    console.print(
        Panel(f"[bold blue]编辑图片[/bold blue]\n图片: {image_path}\n指令: {instruction}")
    )

    agent = VisCreateAgent()
    result = agent.edit_image(
        image_path=image_path,
        instruction=instruction,
        output_path=output,
    )

    if result.success:
        console.print(f"[bold green]✓ 图片已编辑:[/bold green] {result.file_path}")
    else:
        console.print(f"[bold red]✗ 编辑失败:[/bold red] {result.error}")


@app.command()
def interactive():
    """
    启动交互式Agent模式
    """
    console.print(
        Panel(
            "[bold green]VisCreate Agent[/bold green]\n"
            "输入你的创作需求，AI将帮你完成图片和视频的生成。\n"
            "输入 'quit' 或 'exit' 退出。",
            title="交互模式",
        )
    )

    agent = VisCreateAgent()

    while True:
        try:
            user_input = console.input("\n[bold cyan]你:[/bold cyan] ")

            if user_input.lower() in ["quit", "exit", "q"]:
                console.print("[bold yellow]再见！[/bold yellow]")
                break

            if not user_input.strip():
                continue

            response = agent.chat(user_input)
            console.print(f"\n[bold green]Agent:[/bold green] {response}")

        except KeyboardInterrupt:
            console.print("\n[bold yellow]再见！[/bold yellow]")
            break
        except Exception as e:
            console.print(f"[bold red]错误:[/bold red] {e}")


if __name__ == "__main__":
    app()
