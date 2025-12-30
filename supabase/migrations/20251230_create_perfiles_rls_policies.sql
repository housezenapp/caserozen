/*
  # Políticas RLS para la tabla perfiles

  Este script crea las políticas de seguridad de nivel de fila (RLS) para la tabla perfiles.
  Permite que los usuarios autenticados puedan:
  - Ver su propio perfil
  - Crear su propio perfil
  - Actualizar su propio perfil
*/

-- Habilitar RLS en la tabla perfiles si no está habilitado
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay (para evitar duplicados)
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Los usuarios pueden crear su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON perfiles;

-- Política para SELECT: Los usuarios pueden ver su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON perfiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Política para INSERT: Los usuarios pueden crear su propio perfil
CREATE POLICY "Los usuarios pueden crear su propio perfil"
  ON perfiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Política para UPDATE: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON perfiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
