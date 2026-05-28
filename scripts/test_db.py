#!/usr/bin/env python3
"""
测试数据库连接脚本
"""

import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, inspect, text

def test_connection():
    """测试数据库连接"""
    print("=" * 50)
    print("测试 PostgreSQL 数据库连接")
    print("=" * 50)

    # 读取配置
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "vis-create")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "")

    print(f"\n数据库配置:")
    print(f"  主机: {db_host}")
    print(f"  端口: {db_port}")
    print(f"  数据库: {db_name}")
    print(f"  用户: {db_user}")

    try:
        # 构建数据库URL
        database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

        # 测试连接
        print("\n正在连接数据库...")
        engine = create_engine(database_url)

        # 执行简单查询
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ 数据库连接成功!")

        # 列出所有表
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\n数据库中的表:")
        if tables:
            for table in tables:
                print(f"  - {table}")
        else:
            print("  (空数据库，暂无表)")

        print("\n" + "=" * 50)
        print("数据库连接测试完成!")
        print("=" * 50)

        return True

    except Exception as e:
        print(f"\n✗ 数据库连接失败: {e}")
        print("\n请检查:")
        print("  1. PostgreSQL 服务是否正在运行")
        print("  2. 数据库 'vis-create' 是否已创建")
        print("  3. .env 文件中的密码是否正确")
        return False

if __name__ == "__main__":
    success = test_connection()
    exit(0 if success else 1)
