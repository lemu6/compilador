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
  .limit locals 2

  iconst_0
  istore 1
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iload 1
  invokevirtual java/io/PrintStream/println(I)V
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iconst_0
  invokevirtual java/io/PrintStream/println(I)V

  return
.end method