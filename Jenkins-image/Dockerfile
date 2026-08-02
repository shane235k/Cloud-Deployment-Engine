FROM jenkins/jenkins:lts

USER root

# Pull official Docker CLI (includes buildx)
COPY --from=docker:29.6.1-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker:29.6.1-cli /usr/local/libexec/docker/cli-plugins /usr/local/libexec/docker/cli-plugins

RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    python3 \
    python3-pip \
    openssh-client \
    jq \
    ca-certificates

# kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -m 0755 kubectl /usr/local/bin/kubectl && \
    rm kubectl

# Terraform
RUN curl -LO https://releases.hashicorp.com/terraform/1.13.1/terraform_1.13.1_linux_amd64.zip && \
    unzip terraform_1.13.1_linux_amd64.zip && \
    mv terraform /usr/local/bin && \
    rm terraform_1.13.1_linux_amd64.zip

# AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf aws awscliv2.zip

ENV DOCKER_BUILDKIT=1
ENV AWS_PAGER=""

USER jenkins