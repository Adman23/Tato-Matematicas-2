#!/usr/bin/env python3
"""
Script de verificación de conexión a Supabase
Ejecutar: python test_connection.py
"""

from app.services.supabase import supabase

def test_connection():
    print("=" * 60)
    print("🔍 VERIFICANDO CONEXIÓN A SUPABASE")
    print("=" * 60)
    print()

    try:
        # Test 1: Verificar juegos
        print("1️⃣  Consultando juegos...")
        result = supabase.table('games').select('*').execute()
        print(f"   ✅ Juegos encontrados: {len(result.data)}")
        for game in result.data:
            print(f"      - {game['name']} ({game['game_type']})")
        print()

        # Test 2: Verificar usuarios
        print("2️⃣  Consultando usuarios...")
        result = supabase.table('user_profiles').select('*').execute()
        print(f"   ✅ Usuarios encontrados: {len(result.data)}")
        for user in result.data:
            print(f"      - {user['full_name']} ({user['role']})")
        print()

        # Test 3: Verificar estudiantes
        print("3️⃣  Consultando estudiantes...")
        result = supabase.table('students').select('*').execute()
        print(f"   ✅ Estudiantes encontrados: {len(result.data)}")
        if len(result.data) == 0:
            print("      (Ninguno creado aún - esto es normal)")
        print()

        # Test 4: Verificar storage buckets (se hace diferente)
        print("4️⃣  Verificando storage buckets...")
        try:
            buckets = supabase.storage.list_buckets()
            print(f"   ✅ Buckets encontrados: {len(buckets)}")
            for bucket in buckets:
                public_status = "público" if bucket.get('public') else "privado"
                print(f"      - {bucket['name']} ({public_status})")
        except:
            print(f"   ⚠️  No se pueden listar buckets (normal si no hay permisos)")
        print()

        print("=" * 60)
        print("✅ TODAS LAS CONEXIONES FUNCIONAN CORRECTAMENTE")
        print("=" * 60)
        print()
        print("🚀 El backend está listo para usarse!")
        print()

        return True

    except Exception as e:
        print()
        print("=" * 60)
        print("❌ ERROR DE CONEXIÓN")
        print("=" * 60)
        print(f"Error: {e}")
        print()
        print("💡 Verifica:")
        print("   1. Que el archivo .env tenga las credenciales correctas")
        print("   2. Que Supabase esté accesible")
        print("   3. Que las tablas existan en la base de datos")
        print()
        return False


if __name__ == "__main__":
    test_connection()
