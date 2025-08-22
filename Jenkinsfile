@Library('jenkins-shared-library') _

import api.ApiProcessor
import api.DockerApi
import Utils

pipeline {
  agent any
  environment {
    GITHUB_URL = "github.com/lukasbriza/homeport-personal-apps"
    PROJECT_DIR = "homeport-personal-apps"
  }
  stages {
    stage("Check workspace") {
      when {
        expression { fileExists(env.PROJECT_DIR) }
      }
      steps {
        script {
          checkWorkspace("${env.PROJECT_DIR}")
        }
      }
    }

    stage("Checking prerequisities") {
      steps {
        script {
          // Creates in env: PLATFORM, PROJECT_NAME, ENVIRONMENT, VERSION, COMPOSE_FILE_NAME
          checkPrerequisities(4, env.BRANCH_NAME, env.API_PROCESSOR_API)
        }
      }
    }

    stage("Fetching secrets") {
      steps {
        script {
          def api = new ApiProcessor(this)
          def sharedSecrets = api.getProjectSecrets(env.API_PROCESSOR_API, env.PLATFORM, "shared", env.ENVIRONMENT)
          def secrets = api.getProjectSecrets(env.API_PROCESSOR_API, env.PLATFORM, env.PROJECT_NAME, env.ENVIRONMENT)

          env.DOCKER_NAME = sharedSecrets["DOCKER_NAME"]
          env.DOCKER_PASSWORD = sharedSecrets["DOCKER_PASSWORD"]
          env.SEND_EMAIL_ADDRESS = sharedSecrets["SEND_EMAIL_ADDRESS"]
          env.GITHUB_PAT = sharedSecrets["GITHUB_PAT"]

          if(env.PROJECT_NAME == "actual"){
            env.DATABASE_PORT = secrets["DATABASE_PORT"]
            env.HOST_DATABASE_PATH = secrets["HOST_DATABASE_PATH"]
          }

          if(env.PROJECT_NAME == "homer"){
            env.HOST_HOMER_DATA_PATH = secrets["HOST_HOMER_DATA_PATH"]
            env.HOST_HOMER_PORT = secrets["HOST_HOMER_PORT"]
          }

          if(env.PROJECT_NAME == "vaultwarden"){
            env.VAULTWARDEN_DOMAIN = secrets["VAULTWARDEN_DOMAIN"]
            env.HOST_VAULTWARDEN_PORT = secrets["HOST_VAULTWARDEN_PORT"]
            env.HOST_VAULTWARDEN_DATA_PATH = secrets["HOST_VAULTWARDEN_DATA_PATH"]

            // Will be defined during runtime when created for the first time.
            if (secrets["VAULTWARDEN_ADMIN_TOKEN"]){
              env.VAULTWARDEN_ADMIN_TOKEN = secrets["VAULTWARDEN_ADMIN_TOKEN"]
            }
          }

          if(env.PROJECT_NAME == "seafile"){
            env.SEAFILE_MYSQL_ROOT_PASSWORD = secrets["SEAFILE_MYSQL_ROOT_PASSWORD"]
            env.HOST_SEAFILE_PORT = secrets["HOST_SEAFILE_PORT"]
            env.SEAFILE_MYSQL_DB_PASSWORD = secrets["SEAFILE_MYSQL_DB_PASSWORD"]
            env.SEAFILE_ADMIN_EMAIL = secrets["SEAFILE_ADMIN_EMAIL"]
            env.SEAFILE_ADMIN_PASSWORD = secrets["SEAFILE_ADMIN_PASSWORD"]
            env.SEAFILE_SERVER_HOSTNAME = secrets["SEAFILE_SERVER_HOSTNAME"]
            env.SEAFILE_SERVER_PROTOCOL = secrets["SEAFILE_SERVER_PROTOCOL"]
            env.JWT_PRIVATE_KEY = secrets["JWT_PRIVATE_KEY"]
            env.HOST_SEAFILE_DATA_PATH = secrets["HOST_SEAFILE_DATA_PATH"]
            env.HOST_SEAFILE_DB_DATA_PATH = secrets["HOST_SEAFILE_DB_DATA_PATH"]
          }

          env.COMPOSE_FILE_NAME = "apps/${env.PROJECT_NAME}/docker-compose-${env.ENVIRONMENT}.yaml"
        }
      }
    }

    stage("Clone branch") {
      steps {
        script {
          cloneBranch("https://lukasbriza:${env.GITHUB_PAT}@${env.GITHUB_URL}.git")
        }
      }
    }

    stage("Build Docker images") {
      steps {
        script {
          buildImages(env.COMPOSE_FILE_NAME)
        }
      }
    }

    stage("Try to run stack") {
      steps {
        script {
          if(env.PROJECT_NAME == "actual"){
            runComposeFile(env.COMPOSE_FILE_NAME, [env.HOST_DATABASE_PATH])
          }

          if(env.PROJECT_NAME == "homer"){
            runComposeFile(env.COMPOSE_FILE_NAME, [env.HOST_HOMER_DATA_PATH])
          }

          if(env.PROJECT_NAME == "vaultwarden"){
            runComposeFile(env.COMPOSE_FILE_NAME, [env.HOST_VAULTWARDEN_DATA_PATH])
          }

          if(env.PROJECT_NAME == "seafile"){
            runComposeFile(env.COMPOSE_FILE_NAME, [env.HOST_SEAFILE_DATA_PATH, env.HOST_SEAFILE_DB_DATA_PATH])
          }
        }
      }
    }

    stage("Stop stack") {
      steps {
        script {
          stopComposeStack(env.COMPOSE_FILE_NAME)
        }
      }
    }

    stage("Push images") {
      steps {
        script {
          pushComposeFile(env.DOCKER_PASSWORD, env.DOCKER_NAME, env.COMPOSE_FILE_NAME)
        }
      }
    }

    stage("Deploy application") {
      steps {
        script {
          if(env.PROJECT_NAME == "actual"){
            deploy(
              env.API_PROCESSOR_API,
              env.PLATFORM,
              env.PROJECT_NAME,
              env.ENVIRONMENT,
              "https://${env.GITHUB_URL}",
              "lukasbriza",
              env.GITHUB_PAT,
              env.COMPOSE_FILE_NAME,
              [
                ["name": "DATABASE_PORT", "value": "${env.DATABASE_PORT}"],
                ["name": "HOST_DATABASE_PATH", "value": "${env.HOST_DATABASE_PATH}"]
              ]
            )
          }

          if(env.PROJECT_NAME == "homer"){
            deploy(
              env.API_PROCESSOR_API,
              env.PLATFORM,
              env.PROJECT_NAME,
              env.ENVIRONMENT,
              "https://${env.GITHUB_URL}",
              "lukasbriza",
              env.GITHUB_PAT,
              env.COMPOSE_FILE_NAME,
              [
                ["name": "HOST_HOMER_PORT", "value": "${env.HOST_HOMER_PORT}"],
                ["name": "HOST_HOMER_DATA_PATH", "value": "${env.HOST_HOMER_DATA_PATH}"]
              ]
            )
          }

          if(env.PROJECT_NAME == "vaultwarden"){
            deploy(
              env.API_PROCESSOR_API,
              env.PLATFORM,
              env.PROJECT_NAME,
              env.ENVIRONMENT,
              "https://${env.GITHUB_URL}",
              "lukasbriza",
              env.GITHUB_PAT,
              env.COMPOSE_FILE_NAME,
              [
                ["name": "VAULTWARDEN_DOMAIN", "value": "${env.VAULTWARDEN_DOMAIN}"],
                ["name": "HOST_VAULTWARDEN_PORT", "value": "${env.HOST_VAULTWARDEN_PORT}"],
                ["name": "HOST_VAULTWARDEN_DATA_PATH", "value": "${env.HOST_VAULTWARDEN_DATA_PATH}"],
                ["name": "VAULTWARDEN_ADMIN_TOKEN", "value": "${env.VAULTWARDEN_ADMIN_TOKEN}"]
              ]
            )
          }

          if(env.PROJECT_NAME == "seafile"){
            deploy(
              env.API_PROCESSOR_API,
              env.PLATFORM,
              env.PROJECT_NAME,
              env.ENVIRONMENT,
              "https://${env.GITHUB_URL}",
              "lukasbriza",
              env.GITHUB_PAT,
              env.COMPOSE_FILE_NAME,
              [
                ["name": "SEAFILE_MYSQL_ROOT_PASSWORD", "value": "${env.SEAFILE_MYSQL_ROOT_PASSWORD}"],
                ["name": "SEAFILE_MYSQL_DB_PASSWORD", "value": "${env.SEAFILE_MYSQL_DB_PASSWORD}"],
                ["name": "HOST_SEAFILE_PORT", "value": "${env.HOST_SEAFILE_PORT}"],
                ["name": "SEAFILE_ADMIN_EMAIL", "value": "${env.SEAFILE_ADMIN_EMAIL}"],
                ["name": "SEAFILE_ADMIN_PASSWORD", "value": "${env.SEAFILE_ADMIN_PASSWORD}"],
                ["name": "SEAFILE_SERVER_HOSTNAME", "value": "${env.SEAFILE_SERVER_HOSTNAME}"],
                ["name": "SEAFILE_SERVER_PROTOCOL", "value": "${env.SEAFILE_SERVER_PROTOCOL}"],
                ["name": "JWT_PRIVATE_KEY", "value": "${env.JWT_PRIVATE_KEY}"],
                ["name": "HOST_SEAFILE_DATA_PATH", "value": "${env.HOST_SEAFILE_DATA_PATH}"],
                ["name": "HOST_SEAFILE_DB_DATA_PATH", "value": "${env.HOST_SEAFILE_DB_DATA_PATH}"]
              ]
            )
          }
        }
      }
    }
  }
  post {
    always {
      script {
        echo "ℹ️ Cleaning up"
        def dockerApi = new DockerApi(this)

        if (fileExists("${env.PROJECT_DIR}")) {
          dir ("${env.PROJECT_DIR}") {
            dockerApi.stopDockerCompose(env.COMPOSE_FILE_NAME)
          } 
            sh "rm -rf ${env.PROJECT_DIR}"
        }
        
        dockerApi.cleanDocker()
        def utils = new Utils(this)

        if(env.PROJECT_NAME == "actual"){
          utils.recursiveRemoveDir(env.HOST_DATABASE_PATH)
        }

        if(env.PROJECT_NAME == "homer"){
          utils.recursiveRemoveDir(env.HOST_HOMER_DATA_PATH)
        }

        if(env.PROJECT_NAME == "vaultwarden"){
          utils.recursiveRemoveDir(env.HOST_VAULTWARDEN_DATA_PATH)
        }

        if(env.PROJECT_NAME == "seafile"){
          utils.recursiveRemoveDir(env.HOST_SEAFILE_DATA_PATH)
          utils.recursiveRemoveDir(env.HOST_SEAFILE_DB_DATA_PATH)
        }
      }
    }

    success {
      echo "✅ Job succeeded!"

      mail to: "${env.SEND_EMAIL_ADDRESS}",
        subject: "Jenkins: Job of tag/branch ${env.BRANCH_NAME} ${env.BUILD_DISPLAY_NAME} succeeded!",
        body: """
          Project ${env.PROJECT_DIR}:
          Job ${env.BUILD_DISPLAY_NAME} with url ${env.JOB_URL} succeeded!
          For more information visit url above. 
        """
    }

    failure {
      echo "❎ Build failed!"

       mail to: "${env.SEND_EMAIL_ADDRESS}",
        subject: "Jenkins: Job of tag/branch ${env.PROJECT_DIR} ${env.BUILD_DISPLAY_NAME} failed!",
        body: """
          Project ${env.PROJECT_DIR}:
          Job ${env.BUILD_DISPLAY_NAME} with url ${env.JOB_URL} failed!
          For more information visit url above. 
        """
    }
  }
}
