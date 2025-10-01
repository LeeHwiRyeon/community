pipeline {
    agent any
    
    environment {
        REGISTRY = 'registry.example.com'
        IMAGE_NAME = 'community-platform'
        KUBECONFIG = credentials('kubeconfig')
        DOCKER_CREDENTIALS = credentials('docker-registry')
    }
    
    stages {
        // =============================================================================
        // CODE QUALITY & TESTING
        // =============================================================================
        
        stage('Code Quality') {
            parallel {
                stage('Linting') {
                    steps {
                        sh '''
                            npm ci
                            cd frontend && npm ci
                            cd ../server-backend && npm ci
                            npm run lint
                            cd frontend && npm run lint
                            cd ../server-backend && npm run lint
                        '''
                    }
                }
                
                stage('Formatting') {
                    steps {
                        sh '''
                            npm run format:check
                            cd frontend && npm run format:check
                            cd ../server-backend && npm run format:check
                        '''
                    }
                }
                
                stage('Type Checking') {
                    steps {
                        sh '''
                            npm run type-check
                            cd frontend && npm run type-check
                            cd ../server-backend && npm run type-check
                        '''
                    }
                }
            }
        }
        
        stage('Unit Tests') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        sh '''
                            cd frontend
                            npm ci
                            npm run test:unit
                        '''
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'frontend/coverage/junit.xml'
                            publishCoverage adapters: [coberturaAdapter('frontend/coverage/cobertura-coverage.xml')]
                        }
                    }
                }
                
                stage('Backend Tests') {
                    steps {
                        sh '''
                            cd server-backend
                            npm ci
                            npm run test:unit
                        '''
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'server-backend/coverage/junit.xml'
                            publishCoverage adapters: [coberturaAdapter('server-backend/coverage/cobertura-coverage.xml')]
                        }
                    }
                }
                
                stage('Microservices Tests') {
                    steps {
                        sh '''
                            npm ci
                            npm run test:unit
                        '''
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'coverage/junit.xml'
                            publishCoverage adapters: [coberturaAdapter('coverage/cobertura-coverage.xml')]
                        }
                    }
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh '''
                    npm ci
                    npm run migrate:up
                    npm run test:integration
                '''
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'coverage/junit.xml'
                }
            }
        }
        
        stage('E2E Tests') {
            steps {
                sh '''
                    npm ci
                    cd frontend && npm ci
                    npm run build
                    cd frontend && npm run build
                    npm run start &
                    cd frontend && npm run start &
                    sleep 30
                    npm run test:e2e
                '''
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'playwright-report/junit.xml'
                    archiveArtifacts artifacts: 'playwright-report/', fingerprint: true
                }
            }
        }
        
        // =============================================================================
        // SECURITY SCANNING
        // =============================================================================
        
        stage('Security Scan') {
            parallel {
                stage('Dependency Scan') {
                    steps {
                        sh '''
                            npm audit --audit-level moderate
                            cd frontend && npm audit --audit-level moderate
                            cd ../server-backend && npm audit --audit-level moderate
                        '''
                    }
                }
                
                stage('Container Scan') {
                    steps {
                        sh '''
                            trivy image --exit-code 1 --severity HIGH,CRITICAL $REGISTRY/$IMAGE_NAME/frontend:$BUILD_NUMBER
                            trivy image --exit-code 1 --severity HIGH,CRITICAL $REGISTRY/$IMAGE_NAME/api-gateway:$BUILD_NUMBER
                        '''
                    }
                }
            }
        }
        
        // =============================================================================
        // DOCKER IMAGE BUILDING
        // =============================================================================
        
        stage('Build Images') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        sh '''
                            docker build -t $REGISTRY/$IMAGE_NAME/frontend:$BUILD_NUMBER -f frontend/Dockerfile frontend/
                            docker tag $REGISTRY/$IMAGE_NAME/frontend:$BUILD_NUMBER $REGISTRY/$IMAGE_NAME/frontend:latest
                        '''
                    }
                }
                
                stage('Build API Gateway') {
                    steps {
                        sh '''
                            docker build -t $REGISTRY/$IMAGE_NAME/api-gateway:$BUILD_NUMBER -f microservices/api-gateway/Dockerfile microservices/api-gateway/
                            docker tag $REGISTRY/$IMAGE_NAME/api-gateway:$BUILD_NUMBER $REGISTRY/$IMAGE_NAME/api-gateway:latest
                        '''
                    }
                }
                
                stage('Build Microservices') {
                    steps {
                        sh '''
                            for service in auth-service user-service content-service notification-service analytics-service search-service file-service chat-service admin-service; do
                                docker build -t $REGISTRY/$IMAGE_NAME/$service:$BUILD_NUMBER -f microservices/services/$service/Dockerfile microservices/services/$service/
                                docker tag $REGISTRY/$IMAGE_NAME/$service:$BUILD_NUMBER $REGISTRY/$IMAGE_NAME/$service:latest
                            done
                        '''
                    }
                }
            }
        }
        
        stage('Push Images') {
            steps {
                sh '''
                    docker login -u $DOCKER_CREDENTIALS_USR -p $DOCKER_CREDENTIALS_PSW $REGISTRY
                    docker push $REGISTRY/$IMAGE_NAME/frontend:$BUILD_NUMBER
                    docker push $REGISTRY/$IMAGE_NAME/frontend:latest
                    docker push $REGISTRY/$IMAGE_NAME/api-gateway:$BUILD_NUMBER
                    docker push $REGISTRY/$IMAGE_NAME/api-gateway:latest
                    for service in auth-service user-service content-service notification-service analytics-service search-service file-service chat-service admin-service; do
                        docker push $REGISTRY/$IMAGE_NAME/$service:$BUILD_NUMBER
                        docker push $REGISTRY/$IMAGE_NAME/$service:latest
                    done
                '''
            }
        }
        
        // =============================================================================
        // DEPLOYMENT
        // =============================================================================
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    kubectl apply -f microservices/k8s/namespace.yaml
                    kubectl apply -f microservices/k8s/configmap.yaml
                    kubectl apply -f microservices/k8s/secrets.yaml
                    kubectl apply -f microservices/k8s/databases.yaml
                    kubectl apply -f microservices/k8s/services.yaml
                    kubectl apply -f microservices/k8s/deployments.yaml
                    kubectl apply -f microservices/k8s/ingress.yaml
                    kubectl apply -f microservices/k8s/monitoring.yaml
                    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=community-platform --namespace=community-platform --timeout=600s
                '''
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    ./production/scripts/deploy.sh
                    ./production/scripts/validate.sh
                    ./production/scripts/backup.sh
                '''
            }
        }
        
        // =============================================================================
        // POST-DEPLOYMENT
        // =============================================================================
        
        stage('Smoke Tests') {
            steps {
                sh '''
                    kubectl get services --namespace=community-platform
                    kubectl get pods --namespace=community-platform
                    kubectl get ingress --namespace=community-platform
                '''
            }
        }
        
        stage('Performance Tests') {
            steps {
                sh '''
                    npm run test:performance
                '''
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'performance-results/junit.xml'
                    archiveArtifacts artifacts: 'performance-results/', fingerprint: true
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        
        success {
            slackSend channel: '#deployments', color: 'good', message: "Community Platform deployment successful! 🎉 Build: ${env.BUILD_NUMBER}"
        }
        
        failure {
            slackSend channel: '#deployments', color: 'danger', message: "Community Platform deployment failed! ❌ Build: ${env.BUILD_NUMBER}"
        }
        
        unstable {
            slackSend channel: '#deployments', color: 'warning', message: "Community Platform deployment unstable! ⚠️ Build: ${env.BUILD_NUMBER}"
        }
    }
}
