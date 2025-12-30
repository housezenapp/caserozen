/*
  # Políticas RLS para la tabla propiedades

  Este script crea las políticas de seguridad de nivel de fila (RLS) para la tabla propiedades.
  Permite que los usuarios autenticados puedan:
  - Ver sus propias propiedades
  - Crear sus propias propiedades
  - Actualizar sus propias propiedades
  - Eliminar sus propias propiedades
*/

-- Habilitar RLS en la tabla propiedades si no está habilitado
ALTER TABLE propiedades ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay (para evitar duplicados)
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias propiedades" ON propiedades;
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propias propiedades" ON propiedades;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias propiedades" ON propiedades;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propias propiedades" ON propiedades;

-- Política para SELECT: Los usuarios pueden ver sus propias propiedades
CREATE POLICY "Los usuarios pueden ver sus propias propiedades"
  ON propiedades
  FOR SELECT
  TO authenticated
  USING (perfil_id = auth.uid());

-- Política para INSERT: Los usuarios pueden crear sus propias propiedades
CREATE POLICY "Los usuarios pueden crear sus propias propiedades"
  ON propiedades
  FOR INSERT
  TO authenticated
  WITH CHECK (perfil_id = auth.uid());

-- Política para UPDATE: Los usuarios pueden actualizar sus propias propiedades
CREATE POLICY "Los usuarios pueden actualizar sus propias propiedades"
  ON propiedades
  FOR UPDATE
  TO authenticated
  USING (perfil_id = auth.uid())
  WITH CHECK (perfil_id = auth.uid());

-- Política para DELETE: Los usuarios pueden eliminar sus propias propiedades
CREATE POLICY "Los usuarios pueden eliminar sus propias propiedades"
  ON propiedades
  FOR DELETE
  TO authenticated
  USING (perfil_id = auth.uid());
