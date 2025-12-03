.class public Main
.super java/lang/Object

; construtor padrão
.method public <init>()V
  aload_0
  invokespecial java/lang/Object/<init>()V
  return
.end method

; método main
.method public static main([Ljava/lang/String;)V
  .limit stack 100
  .limit locals 3

  ldc "Hello World"
  astore 1
  getstatic java/lang/System/out Ljava/io/PrintStream;
  aload 1
  invokevirtual java/lang/Object/toString()Ljava/lang/String;
  invokevirtual java/io/PrintStream/println(Ljava/lang/String;)V
  ldc "Ola Jasmin!"
  astore 2
  getstatic java/lang/System/out Ljava/io/PrintStream;
  aload 2
  invokevirtual java/lang/Object/toString()Ljava/lang/String;
  invokevirtual java/io/PrintStream/println(Ljava/lang/String;)V

  return
.end method
