@Library('jenkins-shared-library') _

import api.ApiProcessor
import api.DockerApi
import Utils

pipeline {
  agent any
  environment {
    GITHUB_URL = "github.com/lukasbriza/homeport-actual-budget-manager"
    PROJECT_DIR = "homeport-actual-budget-manager"
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

          env.DATABASE_PORT = secrets["DATABASE_PORT"]
          env.HOST_DATABASE_PATH = secrets["HOST_DATABASE_PATH"]
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
          runComposeFile(env.COMPOSE_FILE_NAME, [env.HOST_DATABASE_PATH])
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
        utils.recursiveRemoveDir(env.HOST_DATABASE_PATH)
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
