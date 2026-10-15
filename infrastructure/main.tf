# ==============================================================================
# AWS Infrastructure Configuration (infrastructure/main.tf)
# Provisions VPC, RDS PostgreSQL, ElastiCache Redis, EventBridge, & ECS Fargate
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------------------------
# Variables
# ------------------------------------------------------------------------------
variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS deployment region"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment name"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Master password for PostgreSQL database"
}

# ------------------------------------------------------------------------------
# Networking: VPC, Subnets, & Route Tables
# ------------------------------------------------------------------------------
resource "aws_vpc" "fincommerce_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "fincommerce-vpc-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.fincommerce_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = { Name = "fincommerce-public-a" }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.fincommerce_vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"

  tags = { Name = "fincommerce-private-a" }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.fincommerce_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}b"

  tags = { Name = "fincommerce-private-b" }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.fincommerce_vpc.id
  tags   = { Name = "fincommerce-igw" }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.fincommerce_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = { Name = "fincommerce-public-rt" }
}

resource "aws_route_table_association" "public_assoc_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

# ------------------------------------------------------------------------------
# Security Groups
# ------------------------------------------------------------------------------
resource "aws_security_group" "app_sg" {
  name        = "fincommerce-app-sg"
  description = "Allow HTTP traffic to Express application"
  vpc_id      = aws_vpc.fincommerce_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db_sg" {
  name        = "fincommerce-db-sg"
  description = "Allow PostgreSQL connection from ECS service"
  vpc_id      = aws_vpc.fincommerce_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }
}

resource "aws_security_group" "redis_sg" {
  name        = "fincommerce-redis-sg"
  description = "Allow Redis access from application service"
  vpc_id      = aws_vpc.fincommerce_vpc.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }
}

# ------------------------------------------------------------------------------
# Managed Databases: RDS PostgreSQL & ElastiCache Redis
# ------------------------------------------------------------------------------
resource "aws_db_subnet_group" "db_subnets" {
  name       = "fincommerce-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

resource "aws_db_instance" "postgres" {
  identifier             = "fincommerce-ledger-db"
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.t4g.micro"
  db_name                = "fincommercedb"
  username               = "finadmin"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot    = true
}

resource "aws_elasticache_subnet_group" "redis_subnets" {
  name       = "fincommerce-redis-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "fincommerce-idempotency-redis"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnets.name
  security_group_ids   = [aws_security_group.redis_sg.id]
}

# ------------------------------------------------------------------------------
# Event Driven Messaging: EventBridge Bus & Dead-Letter SQS Queue
# ------------------------------------------------------------------------------
resource "aws_cloudwatch_event_bus" "fincommerce_bus" {
  name = "fincommerce-event-bus-${var.environment}"
}

resource "aws_sqs_queue" "dlq" {
  name                      = "fincommerce-fraud-dlq-${var.environment}"
  message_retention_seconds = 1209600 # 14 days
}

resource "aws_cloudwatch_event_rule" "fraud_flagged_rule" {
  name           = "route-high-risk-to-dlq"
  event_bus_name = aws_cloudwatch_event_bus.fincommerce_bus.name

  event_pattern = jsonencode({
    "source"      : ["fincommerce.checkout"],
    "detail-type" : ["OrderPlaced"],
    "detail" : {
      "riskScore" : [{ "numeric" : [">=", 70] }]
    }
  })
}

resource "aws_cloudwatch_event_target" "dlq_target" {
  rule           = aws_cloudwatch_event_rule.fraud_flagged_rule.name
  event_bus_name = aws_cloudwatch_event_bus.fincommerce_bus.name
  arn            = aws_sqs_queue.dlq.arn
}

# ------------------------------------------------------------------------------
# Outputs
# ------------------------------------------------------------------------------
output "postgres_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "PostgreSQL DB endpoint"
}

output "redis_endpoint" {
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
  description = "Redis cluster primary endpoint"
}

output "event_bus_name" {
  value       = aws_cloudwatch_event_bus.fincommerce_bus.name
  description = "AWS EventBridge custom event bus name"
}

output "dlq_url" {
  value       = aws_sqs_queue.dlq.id
  description = "SQS Dead-Letter Queue URL for high-risk order interventions"
}