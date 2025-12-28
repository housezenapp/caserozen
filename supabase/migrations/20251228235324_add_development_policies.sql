/*
  # Políticas de Desarrollo para Modo Sin Autenticación

  ## Resumen
  Añade políticas RLS más permisivas para permitir operaciones en modo desarrollo
  cuando se usa un usuario ficticio sin sesión real de Supabase.

  ## Cambios
  1. Políticas para tabla `propiedades`
    - Permite INSERT, UPDATE, DELETE y SELECT cuando casero_id es el UUID ficticio

  2. Políticas para tabla `caseros`
    - Permite operaciones con el UUID ficticio de desarrollo

  3. Políticas para tabla `tecnicos`
    - Permite operaciones con el UUID ficticio de desarrollo

  ## Notas Importantes
  - Estas políticas SOLO funcionan con el UUID específico: 00000000-0000-0000-0000-000000000000
  - En producción, las políticas originales seguirán protegiendo los datos reales
  - No compromete la seguridad de usuarios autenticados reales
*/

-- Políticas para modo desarrollo en tabla propiedades
CREATE POLICY "Dev mode: permitir ver propiedades del usuario ficticio"
  ON propiedades FOR SELECT
  TO anon
  USING (casero_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Dev mode: permitir crear propiedades del usuario ficticio"
  ON propiedades FOR INSERT
  TO anon
  WITH CHECK (casero_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Dev mode: permitir actualizar propiedades del usuario ficticio"
  ON propiedades FOR UPDATE
  TO anon
  USING (casero_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (casero_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Dev mode: permitir eliminar propiedades del usuario ficticio"
  ON propiedades FOR DELETE
  TO anon
  USING (casero_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Políticas para modo desarrollo en tabla caseros
CREATE POLICY "Dev mode: permitir ver perfil del usuario ficticio"
  ON caseros FOR SELECT
  TO anon
  USING (id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Dev mode: permitir crear perfil del usuario ficticio"
  ON caseros FOR INSERT
  TO anon
  WITH CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Dev mode: permitir actualizar perfil del usuario ficticio"
  ON caseros FOR UPDATE
  TO anon
  USING (id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Políticas para modo desarrollo en tabla tecnicos
CREATE POLICY "Dev mode: permitir ver tecnicos del usuario ficticio"
  ON tecnicos FOR SELECT
  TO anon
  USING (casero_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Dev mode: permitir crear tecnicos del usuario ficticio"
  ON tecnicos FOR INSERT
  TO anon
  WITH CHECK (casero_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Dev mode: permitir actualizar tecnicos del usuario ficticio"
  ON tecnicos FOR UPDATE
  TO anon
  USING (casero_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (casero_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Dev mode: permitir eliminar tecnicos del usuario ficticio"
  ON tecnicos FOR DELETE
  TO anon
  USING (casero_id = '00000000-0000-0000-0000-000000000000'::uuid);
