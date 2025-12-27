/*
  # Políticas de Administrador para Dashboard
  
  Permite que los administradores puedan ver y gestionar todas las tablas
  desde el Table Editor de Supabase, sin las restricciones de RLS.
  
  ## Cambios
  - Agrega políticas para el rol `service_role` en todas las tablas
  - Permite acceso completo desde el dashboard de Supabase
*/

-- Políticas para CASEROS
CREATE POLICY "Service role puede gestionar caseros"
  ON caseros FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para PROPIEDADES
CREATE POLICY "Service role puede gestionar propiedades"
  ON propiedades FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para TECNICOS
CREATE POLICY "Service role puede gestionar tecnicos"
  ON tecnicos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para INCIDENCIAS
CREATE POLICY "Service role puede gestionar incidencias"
  ON incidencias FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para HISTORIAL
CREATE POLICY "Service role puede gestionar historial"
  ON historial_estados FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
