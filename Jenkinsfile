import groovy.json.JsonOutput

@Library('jenkins-shared-library') _

/**
* SUPPORTS ENV VARIABLES FROM PASSBOLT:
* - NODE_ENV
* - DATABASE_PORT
* - DATABASE_PATH
*
* - POINTAINER_TARGET_ENVIRONMENT
* - DOCKER_PASSWORD
* - DOCKER_NAME
* - PORTAINER_API_KEY
* - GITHUB_PAT
* - POSTGRES_PASSWORD
* - POSTGRES_USER
*/

/**
* PIPELINE STEPS
* --------------
* CHECK WORKSPACE
* API HEALTH CHECK
* FETCH SECRETS
* CLONE BRANCH
* BUILD IMAGES
* COMPOSE PROJECT
* PUSH IMAGES
* CREATE/UPDATE PORTAINER STACK
* CLEAN UP
* NOTIFY USER
*/


pipeline {
  agent any
  environment {
    API_PROCESSOR_API = "http://api-processor:3002"
    GITHUB_URL = "github.com/lukasbriza/homeport-actual-budget-manager"
    PROJECT_DIR = "actual-budget-manager"
    PASSBOLT_FOLDER_PROD_ID = "819ce909-bb99-494c-bb40-4a935fa7592f"
    PASSBOLT_SHARED_FOLDER_ID = "61ac7071-e34d-4d18-9651-6fd084c195f3"
    ROOT_VOLUME_FILE = "/build"
  }
  stages {
    stage("Check workspace") {
      when {
        expression { fileExists("${env.PROJECT_DIR}") }
      }
      steps {
        echo "Preparing workspace before build..."
        sh "rm -rf ${env.PROJECT_DIR}"
      }
    }
    stage("API health check") {
      steps {
        script {
          processorApiHealthCheck(env.API_PROCESSOR_API)
        }
      }
    }
    stage("Fetching secrets") {
      script {
        println("Fetching secrets...")
        env.SHARED_SECRETS = passboltApi.getFolderSecrets(env.API_PROCESSOR_API, env.PASSBOLT_SHARED_FOLDER_ID)
        env.SECRETS = passboltApi.getFolderSecrets(API_PROCESSOR_API, env.PASSBOLT_FOLDER_PROD_ID)

        println("Parsing secrets...")
        def secrets = new groovy.json.JsonSlurper().parseText(env.SECRETS)
        def sharedSecrets = new groovy.json.JsonSlurper().parseText(env.SHARED_SECRETS)

        println("Assigning secrets...")
        env.NODE_ENV = secrets["NODE_ENV"]
        env.DATABASE_PORT = secrets["DATABASE_PORT"]
        env.DATABASE_PATH = secrets["DATABASE_PATH"]
        env.POINTAINER_TARGET_ENVIRONMENT = sharedSecrets["POINTAINER_TARGET_ENVIRONMENT"]
        env.SEND_EMAIL_ADDRESS = sharedSecrets["SEND_EMAIL_ADDRESS"]
        env.MAIL_RECIPIENT = sharedSecrets["MAIL_RECIPIENT"]
        env.GITHUB_PAT = sharedSecrets["GITHUB_PAT"]
        env.PORTAINER_API_KEY = sharedSecrets["PORTAINER_API_KEY"]
        env.DOCKER_NAME = sharedSecrets["DOCKER_NAME"]
        env.DOCKER_PASSWORD = sharedSecrets["DOCKER_PASSWORD"]
      }
    }
    stage("Clone branch") {
      steps {
        script {
          dockerApi.cloneEnvSpecificBranch("https://lukasbriza:${env.GITHUB_PAT}@${env.GITHUB_URL}.git")
        }
      }
    }
    stage("Build images") {
      steps {
        script {
            echo "Building images..."
            dir ("${env.PROJECT_DIR}") {
              dockerApi.buildDockerComposeImages()
            }
            sleep(3)
        }
      }
    }
    stage("Try to run compose stack") {
      steps {
        script {
          echo "Trying to run compose stack..."
          dir ("${env.PROJECT_DIR}") {
            // Create volume folder
            sh "mkdir -p ${env.DATABASE_PATH}"
            
            dockerApi.runEnvSpecificDockerCompose()
          }
          sleep(3)
        }
      }
    }
    stage("Stop stack") {
      steps {
        script {
          echo "Stopping composed stack..."
          dir ("${env.PROJECT_DIR}") {
            dockerApi.stopEnvSpecificDockerCompose()
          }
          sleep(3)
        }
      }
    }
    stage("Push images") {
      steps {
        script {
          dockerApi.pushEnvSpecificDockerComposeImages(env.DOCKER_PASSWORD, env.DOCKER_NAME)
        }
      }
    }
    stage("Update/Create Portainer stack") {
      steps {
        script {
          def targetEnvironment = getTargetEnv(env.API_PROCESSOR_API, env.POINTAINER_TARGET_ENVIRONMENT)
          def stacksToRedeploy = getStacksToDeploy(env.API_PROCESSOR_API, "https://${env.GITHUB_URL}")
          def ticker = getTicker()

          def envBody = [
            ["name": "NODE_ENV", "value": "${env.NEXT_PUBLIC_GITHUB}"],
            ["name": "DATABASE_PORT", "value": "${env.NEXT_PUBLIC_MAIL}"],
            ["name": "DATABASE_PATH", "value": "${env.API_KEY}"],
          ]

          if (stacksToRedeploy.size() == 0) {
            println("There is no deployed stack with source url https://${env.GITHUB_URL} in Portainer...")
            println("Initiate new stack...")

            def deployRequestBody = [
              "endpointId": "${targetEnvironment.Id}",
              "name": "coincrusade-runner-game${ticker}",
              "repositoryURL": "https://${env.GITHUB_URL}",
              "repositoryAuthentication": true,
              "repositoryUsername": "lukasbriza",
              "repositoryPassword": "${env.GITHUB_PAT}",
              "repositoryReferenceName": getBranchReference(),
              "composeFile": getComposeFileName(),
              "tlsskipVerify": true,
              "fromAppTemplate": false,
              "autoUpdate": null,
              "additionalFiles": null,
              "env":  envBody
            ]

            def requestBody = new groovy.json.JsonOutput().toJson(deployRequestBody)
            def deployResponse = portainerApi.deployStack(env.API_PROCESSOR_API, requestBody)

            println("Stack deployed...")
            return
          }

          println("Redeploying existing stacks...")

          for (stackToRedeploy in stacksToRedeploy) {
            println("Redeploying stack with Id: ${stackToRedeploy.Id}...")

            def redeployRequestBody = [
              "endpointId": "${targetEnvironment.Id}",
              "stackId": "${stackToRedeploy.Id}",
              "repositoryAuthentication": true,
              "repositoryUsername": "lukasbriza",
              "repositoryPassword": "${env.GITHUB_PAT}",
              "repositoryReferenceName": getBranchReference(),
              "prune": true,
              "pullImage": true,
              "env": envBody
            ]

            def requestBody = new groovy.json.JsonOutput().toJson(redeployRequestBody)
            def redeployResponse = portainerApi.reDeployStack(env.API_PROCESSOR_API, requestBody)

            println("Redeploy of stack with Id: ${stackToRedeploy.Id} was succesfull...")
          }
        }
      }
    }
  }
  post {
    always {
      script {
        println("Cleaning up...")

        if (fileExists("${env.PROJECT_DIR}")) {
          dir ("${env.PROJECT_DIR}") {
            dockerApi.stopEnvSpecificDockerCompose()
          } 
            sh "rm -rf ${env.PROJECT_DIR}"
        }
        
        dockerApi.cleanDocker()
        recursiveRemoveDir(env.DATABASE_PATH)
      }
    }
    success {
      echo "Build succeeded!"

      mail to: "${env.SEND_EMAIL_ADDRESS}",
        subject: "Jenkins: Build of ${env.PROJECT_DIR} ${env.BUILD_DISPLAY_NAME} succeeded!",
        body: """
          Project ${env.PROJECT_DIR}:
          Job ${env.BUILD_DISPLAY_NAME} with url ${env.JOB_URL} succeeded!
          For more information visit url above. 
        """
    }
    failure {
      echo "Build failed!"

      mail to: "${env.SEND_EMAIL_ADDRESS}",
        subject: "Jenkins: Build of ${env.PROJECT_DIR} ${env.BUILD_DISPLAY_NAME} failed!",
        body: """
          Project ${env.PROJECT_DIR}:
          Job ${env.BUILD_DISPLAY_NAME} with url ${env.JOB_URL} failed!
          For more information visit url above. 
        """
    }
  }
}