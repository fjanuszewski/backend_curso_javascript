# {{name}}

Creado a partir de api-sam-template.

## Configuración

Para generar el primer despliegue del proyecto, se debe corroborar los siguientes elementos:

1. Que la variable CICD `CI_PROJECT_NAMESPACE` este haciendo referencia a su cuenta AWS, dentro de **gitlab-ci.yml** se puede configurar. Ej: my-cuenta-nonprod, valor "my-cuenta"
2. Si desea disponibilizar publicamente la api, debe tener un dominio de api generado y configurarlo en la variable `DomainName` dentro de los mapeos del archivo **template.yaml** Ej: my-subdominio.dominio.com en el mapping de develop

## Esbuild

Se usa para la compilacion y minificación del codigo, para la reducción de coldstart de las lambdas

# Desplieges Wiru

Se incorpora el runner a Wiru `RUNNER_CI_AWS_SAM` y su template con procesos automatizados de desplieges `.gitlab-ci-aws-sam.yml` que toma por defecto los entornos propuestos por Wiru y sus tags respectivos, en los cuales estan disponibles:
* Develop
    + `integration`
    + `branch-*`
* Testing
    + `beta-*`
    + `sprint-*`
* Staging
    + `release-*`
* Prodblue
    + `prod-*`

# Serverless Aplication Model (SAM)

Se suma a este desarrollo la anatomia de templates [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification-template-anatomy.html "AWS SAM"), en la cual se agregan simplificaciones a la anatomia [AWS Cloudformation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html "AWS Cloudformation")

Ademas de la disposición del `Mappings` en ***template.yaml*** para el uso de variables estaticas de configuración.

