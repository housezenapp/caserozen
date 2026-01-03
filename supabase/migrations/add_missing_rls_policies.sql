-- Política para que los CASEROS puedan leer sus vinculaciones en perfil_propiedades
CREATE POLICY "Caseros pueden leer sus vinculaciones"
ON perfil_propiedades
FOR SELECT
TO authenticated
USING (id_perfil_casero = auth.uid());

-- Política para que los CASEROS puedan leer las incidencias de sus inquilinos vinculados
CREATE POLICY "Caseros pueden leer incidencias de sus inquilinos"
ON incidencias
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM perfil_propiedades 
    WHERE perfil_propiedades.id_perfil_inquilino = incidencias.user_id 
    AND perfil_propiedades.id_perfil_casero = auth.uid()
  )
);
